/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { IRequest } from "@fluidframework/core-interfaces";
import {
    DriverHeader,
    IFluidResolvedUrl,
    IResolvedUrl,
    IUrlResolver,
} from "@fluidframework/driver-definitions";
import { ConnectionConfig } from "./interfaces";

// Implementation of a URL resolver to resolve documents stored using Routerlicious
// based off of the orderer and storage URLs provide. The token provider here can be a
// InsecureTokenProvider for basic scenarios or more robust, secure providers that fulfill the
// ITokenProvider interface
export class RouterliciousUrlResolver implements IUrlResolver {
    constructor(protected props: ConnectionConfig) {
    }

    public async resolve(request: IRequest): Promise<IFluidResolvedUrl> {
        const containerId = request.url.split("/")[0];
        const { orderer: ordererUrl, storage: storageUrl, tenantId } = this.props;
        // determine whether the request is for creating of a new container.
        // such request has the `createNew` header set to true and doesn't have a container ID.
        if (
            request.headers &&
            request.headers[DriverHeader.createNew] === true
        ) {
            return {
                endpoints: {
                    deltaStorageUrl: `${ordererUrl}/deltas/${tenantId}/new`,
                    ordererUrl,
                    storageUrl: `${storageUrl}/repos/${tenantId}`,
                },
                // id is a mandatory attribute, but it's ignored by the driver for new container requests.
                id: "",
                // tokens attribute is redundant as all tokens are generated via ITokenProvider
                tokens: {},
                type: "fluid",
                url: `${ordererUrl}/${tenantId}/new`,
            };
        }
        if (containerId === undefined) {
            throw new Error("Routerlicious URL did not contain containerId");
        }
        const documentUrl = `${ordererUrl}/${tenantId}/${containerId}`;
        return Promise.resolve({
            endpoints: {
                deltaStorageUrl: `${ordererUrl}/deltas/${tenantId}/${containerId}`,
                ordererUrl,
                storageUrl: `${storageUrl}/repos/${tenantId}`,
            },
            id: containerId,
            tokens: {},
            type: "fluid",
            url: documentUrl,
        });
    }

    public async getAbsoluteUrl(resolvedUrl: IResolvedUrl, relativeUrl: string): Promise<string> {
        if (resolvedUrl.type !== "fluid") {
            throw Error("Invalid Resolved Url");
        }
        return `${resolvedUrl.url}/${relativeUrl}`;
    }
}

export const createRouterliciousCreateNewRequest =
    (documentId?: string): IRequest => (
        {
            url: documentId ?? "",
            headers: {
                [DriverHeader.createNew]: true,
            },
        }
    );
