/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

const { EventEmitter } = require("events");
const level = require("level");
const sublevel = require("level-sublevel");
const { Collection } = require("./levelDbCollection");

const MaxFetchSize = 2000;

class LevelDb extends EventEmitter {

    constructor(path) {
        super();
        this.path = path;
        this.db = sublevel(level(this.path, {
            valueEncoding: "json",
        }));
    }

    async close() {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return this.db.close();
    }

    collection(name) {
        const collectionDb = this.db.sublevel(name);
        return new Collection(collectionDb, this.getProperty(name));
    }

    // LevelDB is a pure key value storage so we need to know the fields prior to generate insertion key.
    // (similar to createIndex() call in mongodb)
    getProperty(name) {
        switch (name) {
            case "deltas":
                return {
                    indexes: ["tenantId", "documentId", "operation.sequenceNumber"],
                    limit: MaxFetchSize,
                };
            case "documents":
                return {
                    indexes: ["tenantId", "documentId"],
                };
            case "nodes":
                return {
                    indexes: ["_id"],
                };
            case "scribeDeltas":
                return {
                    indexes: ["tenantId", "documentId", "operation.sequenceNumber"],
                    limit: MaxFetchSize,
                };
            case "content":
                return {
                    indexes: ["tenantId", "documentId", "sequenceNumber"],
                    limit: MaxFetchSize,
                };
            default:
                throw new Error(`Collection ${name} not implemented.`);
        }
    }
}

module.exports = { LevelDb };
