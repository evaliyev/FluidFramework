/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

// import { generateUser } from "@fluidframework/server-services-client";
// import { InsecureTokenProvider } from "@fluidframework/test-client-utils";
// import {
//     LOCAL_MODE_TENANT_ID,
// } from "..";
import { RouterliciousClient } from "../RouterliciousClient";
import { RouterliciousFunctionTokenProvider } from "../RouterliciousFunctionTokenProvider";

// This function will determine if local or remote mode is required (based on FLUID_CLIENT),
// and return a new AzureClient instance based on the mode by setting the Connection config
// accordingly.
export function createAzureClient(): RouterliciousClient {
    // use AzureClient remote mode will run against live Azure Fluid Relay.
    // Default to running Tinylicious for PR validation
    // and local testing so it's not hindered by service availability
    const connectionProps = {
        tokenProvider: new RouterliciousFunctionTokenProvider("create-new-tenants-if-going-to-production"),
        orderer: "alfredlb.cedit-c-uw2.cloudos.autodesk.com",
        storage: "historianlb.cedit-c-uw2.cloudos.autodesk.com",
        tenantId: "fluid",
    };
    return new RouterliciousClient({ connection: connectionProps });
}
