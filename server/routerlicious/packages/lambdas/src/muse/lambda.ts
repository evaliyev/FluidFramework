/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as crypto from "crypto";
import {
    extractBoxcar,
    IContext,
    IQueuedMessage,
    IPartitionLambda,
    ISequencedOperationMessage,
    SequencedOperationType,
} from "@fluidframework/server-services-core";

import Axios from "axios";

export class MuseLambda implements IPartitionLambda {
    private pending = new Map<string, ISequencedOperationMessage[]>();
    private pendingOffset: IQueuedMessage| undefined;
    private current = new Map<string, ISequencedOperationMessage[]>();

    constructor(
        // private readonly opCollection: ICollection<any>,
        protected context: IContext) {
    }

    public handler(message: IQueuedMessage) {
        const boxcar = extractBoxcar(message);

        for (const baseMessage of boxcar.contents) {
            if (baseMessage.type === SequencedOperationType) {
                const value = baseMessage as ISequencedOperationMessage;

                // Remove traces and serialize content before writing to mongo.
                value.operation.traces = [];

                const topic = `${value.tenantId}/${value.documentId}`;

                let pendingMessages = this.pending.get(topic);
                if (!pendingMessages) {
                    pendingMessages = [];
                    this.pending.set(topic, pendingMessages);
                }

                pendingMessages.push(value);
            }
        }

        this.pendingOffset = message;
        this.sendPending();

        return undefined;
    }

    public close() {
        this.pending.clear();
        this.current.clear();

        return;
    }

    private sendPending() {
        // If there is work currently being sent or we have no pending work return early
        if (this.current.size > 0 || this.pending.size === 0) {
            return;
        }

        // Swap current and pending
        const temp = this.current;
        this.current = this.pending;
        this.pending = temp;
        const batchOffset = this.pendingOffset;

        const allProcessed: Promise<void>[] = [];

        // Process all the batches + checkpoint
        for (const [, messages] of this.current) {
            const processP = this.processMHCore(messages);
            allProcessed.push(processP);
        }

        Promise.all(allProcessed).then(
            () => {
                this.current.clear();
                this.context.checkpoint(batchOffset as IQueuedMessage);
                this.sendPending();
            },
            (error) => {
                this.context.error(error, { restart: true });
            });
    }

    private createDerivedGuid(referenceGuid: string, identifier: string) {
        const hash = crypto.createHash("sha1");
        hash.write(`${referenceGuid}:${identifier}`);
        hash.end();

        const hexHash = hash.digest("hex");
        return `
            ${hexHash.substr(0, 8)}-
            ${hexHash.substr(8, 4)}-
            ${hexHash.substr(12, 4)}-
            ${hexHash.substr(16, 4)}-
            ${hexHash.substr(20, 12)}`;
    }

    private async processMHCore(messages: ISequencedOperationMessage[]): Promise<void> {
        for (const message of messages) {
            if (message?.operation?.type === "op") {
                const contents = JSON.parse(message.operation.contents);
                const opData = contents.contents?.contents?.content?.contents;
                if (opData && opData.op === 0 && opData.changeSet !== undefined) {
                    const branchGuid = contents.contents.contents.content.address;
                    const commitGuid = opData.guid;

                    this.context.log?.info(
                        `MH Commit: branch: ${branchGuid},
                            commit ${commitGuid},
                            changeSet:  ${JSON.stringify(opData.changeSet, undefined, 2)}`,
                            );

                    let parentCommitGuid = opData.referenceGuid;
                    // Create a branch for the first commit that does not yet reference any other commit
                    if (opData.referenceGuid === "") {
                        const rootGuid = this.createDerivedGuid(branchGuid, "root");
                        const branchCreationResponse = await Axios.post("http://127.0.0.1:3070/branch", {
                            guid: branchGuid,
                            rootCommitGuid: rootGuid,
                            meta: {},
                            created: 0,
                        });
                        parentCommitGuid = rootGuid;
                        if (branchCreationResponse.status === 200) {
                            this.context.log?.info("Branch sucessfully created");
                        } else {
                            this.context.log?.error("Branch cration failed");
                        }
                    }

                    // Add the commit
                    const commitCreationResponse =
                        await Axios.post(`http://127.0.0.1:3070/branch/${branchGuid}/commit`, {
                            guid: commitGuid,
                            branchGuid,
                            parentGuid: parentCommitGuid,
                            changeSet: JSON.stringify(opData.changeSet),
                            meta: {
                                sequenceNumber: message.operation.sequenceNumber,
                                minimumSequenceNumber: message.operation.minimumSequenceNumber,
                            },
                            rebase: true,
                        });
                    if (commitCreationResponse.status === 200) {
                        this.context.log?.info("Commit sucessfully created");
                    } else {
                        this.context.log?.error("Commit cration failed");
                    }
                }
            }
        }
    }
}
