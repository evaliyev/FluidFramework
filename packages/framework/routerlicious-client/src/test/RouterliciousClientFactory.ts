/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { RouterliciousClient } from "../RouterliciousClient";
import { RouterliciousFunctionTokenProvider } from "../RouterliciousFunctionTokenProvider";

// This function will determine if local or remote mode is required (based on FLUID_CLIENT),
// and return a new RouterliciousClient instance based on the mode by setting the Connection config
// accordingly.
export function createRouterliciousClient(): RouterliciousClient {
    // use RouterliciousClient remote mode will run against live Azure Fluid Relay.
    // Default to running Tinylicious for PR validation
    // and local testing so it's not hindered by service availability
    const connectionProps = {
        tokenProvider: new RouterliciousFunctionTokenProvider(
            "create-new-tenants-if-going-to-production",
            { userId: "foo", userName: "bar" },
        ),
        orderer: "http://staging-orderer.cedit.autodesk.com",
        storage: "http://staging-storage.cedit.autodesk.com",
        tenantId: "fluid",
    };
    return new RouterliciousClient({ connection: connectionProps });
}
