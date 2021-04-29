/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { EventEmitter } from "events";
import {
    IContext,
    IPartitionLambda,
    IPartitionLambdaConfig,
    IPartitionLambdaFactory,
    MongoManager,
} from "@fluidframework/server-services-core";
import { MuseLambda } from "./lambda";

export class MHTestLambdaFactory extends EventEmitter implements IPartitionLambdaFactory {
    constructor(
        private readonly mongoManager: MongoManager) /* ,
        private readonly opCollection: ICollection<any> ) */ {
        super();
    }

    public async create(config: IPartitionLambdaConfig, context: IContext): Promise<IPartitionLambda> {
        // Takes in the io as well as the collection. I can probably keep the same lambda but only ever give it stuff
        // from a single document
        return new MuseLambda(context);
    }

    public async dispose(): Promise<void> {
        await this.mongoManager.close();
    }
}
