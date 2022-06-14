/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import jwt from "jsonwebtoken";
import { ITokenProvider, ITokenResponse } from "@fluidframework/routerlicious-driver";
import { RouterliciousMember } from "./interfaces";

/**
 * Token Provider implementation for connecting to an Azure Function endpoint for
 * Azure Fluid Relay token resolution.
 */
export class RouterliciousFunctionTokenProvider implements ITokenProvider {
    /**
     * Creates a new instance using configuration parameters.
     * @param azFunctionUrl - URL to Azure Function endpoint
     * @param user - User object
     */
    constructor(
        private readonly tenantKey: string,
        private readonly user?: Pick<RouterliciousMember, "userId" | "userName" | "additionalDetails">,
    ) { }

    public async fetchOrdererToken(tenantId: string, documentId?: string): Promise<ITokenResponse> {
        return {
            jwt: await this.getToken(tenantId, documentId),
        };
    }

    public async fetchStorageToken(tenantId: string, documentId: string): Promise<ITokenResponse> {
        return {
            jwt: await this.getToken(tenantId, documentId),
        };
    }

    private async getToken(tenantId: string, documentId?: string): Promise<string> {
        return jwt.sign(
            {
              user: this.user,
              documentId,
              tenantId,
              scopes: ["doc:read", "doc:write", "summary:write"],
            },
            this.tenantKey);
    }
}
