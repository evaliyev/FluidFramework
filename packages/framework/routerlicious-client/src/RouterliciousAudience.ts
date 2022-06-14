/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { ServiceAudience } from "@fluidframework/fluid-static";
import { IClient } from "@fluidframework/protocol-definitions";
import { IRouterliciousAudience, RouterliciousMember } from "./interfaces";

export class RouterliciousAudience extends ServiceAudience<RouterliciousMember> implements IRouterliciousAudience {
  /**
   * @internal
   */
  protected createServiceMember(audienceMember: IClient): RouterliciousMember {
    return {
      userId: audienceMember.user.id,
      userName: (audienceMember.user as any).name,
      connections: [],
      additionalDetails: (audienceMember.user as any).additionalDetails,
    };
  }
}
