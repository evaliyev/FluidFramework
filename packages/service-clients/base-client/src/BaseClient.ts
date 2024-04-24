/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { AttachState } from "@fluidframework/container-definitions";
import {
	type IContainer,
	type IFluidModuleWithDetails,
} from "@fluidframework/container-definitions/internal";
import { Loader } from "@fluidframework/container-loader/internal";
import {
	type FluidObject,
	type IConfigProviderBase,
	type IRequest,
} from "@fluidframework/core-interfaces";
import { assert } from "@fluidframework/core-utils/internal";
import {
	type IDocumentServiceFactory,
	type IUrlResolver,
} from "@fluidframework/driver-definitions/internal";
import { applyStorageCompression } from "@fluidframework/driver-utils/internal";
import { type ContainerSchema, type IFluidContainer } from "@fluidframework/fluid-static";
import {
	type IRootDataObject,
	createDOProviderContainerRuntimeFactory,
	createFluidContainer,
	createServiceAudience,
} from "@fluidframework/fluid-static/internal";
import { type IClient, SummaryType } from "@fluidframework/protocol-definitions";
import {
	RouterliciousDocumentServiceFactory,
	type ITokenProvider,
} from "@fluidframework/routerlicious-driver/internal";
import { wrapConfigProviderWithDefaults } from "@fluidframework/telemetry-utils/internal";

import type {
	BaseClientProps,
	IContainerServices,
	IContainerVersion,
	IGetVersionsOptions,
} from "./interfaces.js";
import { createAzureAudienceMember } from "./Audience.js";

const MAX_VERSION_COUNT = 5;

/**
 * Default feature gates.
 * These values will only be used if the feature gate is not already set by the supplied config provider.
 */
const azureClientFeatureGates = {
	// Azure client requires a write connection by default
	"Fluid.Container.ForceWriteConnection": true,
};

/**
 * Feature gates required to support runtime compatibility when V1 and V2 clients are collaborating
 */
const azureClientV1CompatFeatureGates = {
	// Disable Garbage Collection
	"Fluid.GarbageCollection.RunSweep": false, // To prevent the GC op
	"Fluid.GarbageCollection.DisableAutoRecovery": true, // To prevent the GC op
	"Fluid.GarbageCollection.ThrowOnTombstoneLoadOverride": false, // For a consistent story of "GC is disabled"
};

/**
 * Wrap the config provider to fall back on the appropriate defaults for Azure Client.
 * @param baseConfigProvider - The base config provider to wrap
 * @returns A new config provider with the appropriate defaults applied underneath the given provider
 */
function wrapConfigProvider(baseConfigProvider?: IConfigProviderBase): IConfigProviderBase {
	const defaults = {
		...azureClientFeatureGates,
		...azureClientV1CompatFeatureGates,
	};
	return wrapConfigProviderWithDefaults(baseConfigProvider, defaults);
}

/**
 * AzureClient provides the ability to have a Fluid object backed by the Azure Fluid Relay or,
 * when running with local tenantId, have it be backed by a local Azure Fluid Relay instance.
 * @public
 */
export abstract class BaseClient {
	private readonly documentServiceFactory: IDocumentServiceFactory;
	private readonly configProvider: IConfigProviderBase | undefined;

	/**
	 * Creates a new client instance using configuration parameters.
	 * @param properties - Properties for initializing a new AzureClient instance
	 */
	public constructor(
		protected readonly properties: BaseClientProps,
		protected readonly urlResolver: IUrlResolver,
		protected readonly tokenProvider: ITokenProvider,
		protected readonly createAzureCreateNewRequest: () => IRequest,
	) {
		const origDocumentServiceFactory: IDocumentServiceFactory =
			new RouterliciousDocumentServiceFactory(this.tokenProvider, {
				enableWholeSummaryUpload: properties.enableWholeSummaryUpload,
				enableDiscovery: properties.enableDiscovery,
			});

		this.documentServiceFactory = applyStorageCompression(
			origDocumentServiceFactory,
			properties.summaryCompression,
		);
		this.configProvider = wrapConfigProvider(properties.configProvider);
	}

	/**
	 * Creates a new detached container instance in the Azure Fluid Relay.
	 * @typeparam TContainerSchema - Used to infer the the type of 'initialObjects' in the returned container.
	 * (normally not explicitly specified.)
	 * @param containerSchema - Container schema for the new container.
	 * @returns New detached container instance along with associated services.
	 */
	public async createContainer<const TContainerSchema extends ContainerSchema>(
		containerSchema: TContainerSchema,
	): Promise<{
		container: IFluidContainer<TContainerSchema>;
		services: IContainerServices;
	}> {
		const loader = this.createLoader(containerSchema);

		const container = await loader.createDetachedContainer({
			package: "no-dynamic-package",
			config: {},
		});

		const fluidContainer = await this.createFluidContainer<TContainerSchema>(container);
		const services = this.getContainerServices(container);
		return { container: fluidContainer, services };
	}

	/**
	 * Creates new detached container out of specific version of another container.
	 * @typeparam TContainerSchema - Used to infer the the type of 'initialObjects' in the returned container.
	 * (normally not explicitly specified.)
	 * @param id - Unique ID of the source container in Azure Fluid Relay.
	 * @param containerSchema - Container schema used to access data objects in the container.
	 * @param version - Unique version of the source container in Azure Fluid Relay.
	 * It defaults to latest version if parameter not provided.
	 * @returns New detached container instance along with associated services.
	 */
	public async copyContainer<TContainerSchema extends ContainerSchema>(
		id: string,
		containerSchema: TContainerSchema,
		version?: IContainerVersion,
	): Promise<{
		container: IFluidContainer<TContainerSchema>;
		services: IContainerServices;
	}> {
		const loader = this.createLoader(containerSchema);
		const sourceContainer = await loader.resolve({ url: id });

		if (sourceContainer.resolvedUrl === undefined) {
			throw new Error("Source container cannot resolve URL.");
		}

		const documentService = await this.documentServiceFactory.createDocumentService(
			sourceContainer.resolvedUrl,
		);
		const storage = await documentService.connectToStorage();
		const handle = {
			type: SummaryType.Handle,
			handleType: SummaryType.Tree,
			handle: version?.id ?? "latest",
		};
		const tree = await storage.downloadSummary(handle);

		const container = await loader.rehydrateDetachedContainerFromSnapshot(JSON.stringify(tree));

		const fluidContainer = await this.createFluidContainer<TContainerSchema>(container);
		const services = this.getContainerServices(container);
		return { container: fluidContainer, services };
	}

	/**
	 * Accesses the existing container given its unique ID in the Azure Fluid Relay.
	 * @typeparam TContainerSchema - Used to infer the the type of 'initialObjects' in the returned container.
	 * (normally not explicitly specified.)
	 * @param id - Unique ID of the container in Azure Fluid Relay.
	 * @param containerSchema - Container schema used to access data objects in the container.
	 * @returns Existing container instance along with associated services.
	 */
	public async getContainer<TContainerSchema extends ContainerSchema>(
		id: string,
		containerSchema: TContainerSchema,
	): Promise<{
		container: IFluidContainer<TContainerSchema>;
		services: IContainerServices;
	}> {
		const loader = this.createLoader(containerSchema);
		const container = await loader.resolve({ url: id });
		const rootDataObject = await this.getContainerEntryPoint(container);
		const fluidContainer = createFluidContainer<TContainerSchema>({
			container,
			rootDataObject,
		});
		const services = this.getContainerServices(container);
		return { container: fluidContainer, services };
	}

	/**
	 * Get the list of versions for specific container.
	 * @param id - Unique ID of the source container in Azure Fluid Relay.
	 * @param options - "Get" options. If options are not provided, API
	 * will assume maxCount of versions to retrieve to be 5.
	 * @returns Array of available container versions.
	 */
	public async getContainerVersions(
		id: string,
		options?: IGetVersionsOptions,
	): Promise<IContainerVersion[]> {
		const resolvedUrl = await this.urlResolver.resolve({ url: id });
		if (!resolvedUrl) {
			throw new Error("Unable to resolved URL");
		}
		const documentService =
			await this.documentServiceFactory.createDocumentService(resolvedUrl);
		const storage = await documentService.connectToStorage();

		// External API uses null
		// eslint-disable-next-line unicorn/no-null
		const versions = await storage.getVersions(null, options?.maxCount ?? MAX_VERSION_COUNT);

		return versions.map((item) => {
			return { id: item.id, date: item.date };
		});
	}

	private getContainerServices(container: IContainer): IContainerServices {
		return {
			audience: createServiceAudience({
				container,
				createServiceMember: createAzureAudienceMember,
			}),
		};
	}

	private createLoader(schema: ContainerSchema): Loader {
		const runtimeFactory = createDOProviderContainerRuntimeFactory({ schema });
		const load = async (): Promise<IFluidModuleWithDetails> => {
			return {
				module: { fluidExport: runtimeFactory },
				details: { package: "no-dynamic-package", config: {} },
			};
		};

		const codeLoader = { load };
		const client: IClient = {
			details: {
				capabilities: { interactive: true },
			},
			permission: [],
			scopes: [],
			user: { id: "" },
			mode: "write",
		};

		return new Loader({
			urlResolver: this.urlResolver,
			documentServiceFactory: this.documentServiceFactory,
			codeLoader,
			logger: this.properties.logger,
			options: { client },
			configProvider: this.configProvider,
		});
	}

	private async createFluidContainer<TContainerSchema extends ContainerSchema>(
		container: IContainer,
	): Promise<IFluidContainer<TContainerSchema>> {
		const createNewRequest = this.createAzureCreateNewRequest();

		const rootDataObject = await this.getContainerEntryPoint(container);

		/**
		 * See {@link FluidContainer.attach}
		 */
		const attach = async (): Promise<string> => {
			if (container.attachState !== AttachState.Detached) {
				throw new Error("Cannot attach container. Container is not in detached state");
			}
			await container.attach(createNewRequest);
			if (container.resolvedUrl === undefined) {
				throw new Error("Resolved Url not available on attached container");
			}
			return container.resolvedUrl.id;
		};
		const fluidContainer = createFluidContainer<TContainerSchema>({
			container,
			rootDataObject,
		});
		fluidContainer.attach = attach;
		return fluidContainer;
	}

	private async getContainerEntryPoint(container: IContainer): Promise<IRootDataObject> {
		const rootDataObject: FluidObject<IRootDataObject> = await container.getEntryPoint();
		assert(
			rootDataObject.IRootDataObject !== undefined,
			0x90a /* entryPoint must be of type IRootDataObject */,
		);
		return rootDataObject.IRootDataObject;
	}
	// #endregion
}
