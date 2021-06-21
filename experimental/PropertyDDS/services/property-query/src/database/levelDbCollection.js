/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

/* eslint-disable @typescript-eslint/no-unsafe-return */

const charwise = require("charwise");
const  _ = require("lodash");

/**
 * Helper function to read a sublevel stream and return a promise for an array of the results.
 */
async function readStream(stream) {
    const entries = [];

    return new Promise((resolve, reject) => {
        stream.on("data", (data) => {
            entries.push(data);
        });

        stream.on("end", () => {
            resolve(entries);
        });

        stream.on("error", (error) => {
            reject(error);
        });
    });
}

export class Collection  {
    constructor(db, property) {
        this.db = db;
        this.property = property;
    }

    async find(query, sort) {
        return this.findInternal(query, sort);
    }

    async findAll() {
        return readStream(this.db.createValueStream());
    }

    findOne(query){
        return this.findOneInternal(query);
    }

    async update(filter, set, addToSet) {
        const value = await this.findOneInternal(filter);
        if (!value) {
            return Promise.reject(new Error("Not found"));
        } else {
            _.extend(value, set);
            return this.insertOne(value);
        }
    }

    async upsert(filter, set, addToSet) {
        const value = await this.findOneInternal(filter);
        if (!value) {
            return this.insertOne(set);
        } else {
            _.extend(value, set);
            return this.insertOne(value);
        }
    }

    async insertOne(value) {
        return this.insertOneInternal(value);
    }

    async findOrCreate(query, value) {
        const existing = await this.findOneInternal(query);
        if (existing) {
            return { value: existing, existing: true };
        } else {
            const item = await this.insertOneInternal(value);
            return { value: item, existing: false };
        }
    }

    async insertMany(values, ordered) {
        const batchValues = [];
        values.forEach((value) => {
            batchValues.push({
                type: "put",
                key: this.getKey(value),
                value,
            });
        });
        return this.db.batch(batchValues);
    }

    async deleteOne(filter) {
        return this.db.del(this.getKey(filter));
    }

    // We should probably implement this.
    async deleteMany(filter) {
        throw new Error("Method not implemented.");
    }

    async createIndex(index, unique) {
        return;
    }

    async insertOneInternal(value) {
        await new Promise((resolve, reject) => {
            this.db.put(this.getKey(value), value, (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });

        return value;
    }

    async findOneInternal(query){
        const values = await this.findInternal(query);
        return values.length > 0 ? values[0] : null;
    }

    // Generate an insertion key for a value based on index structure.
    getKey(value) {
        function getValueByKey(propertyBag, key) {
            const keys = key.split(".");
            let v = propertyBag;
            keys.forEach((splitKey) => {
                v = v[splitKey];
            });
            return v;
        }

        const values = [];
        this.property.indexes.forEach((key) => {
            const innerValue = getValueByKey(value, key);
            // Leveldb does lexicographic comparison. We need to encode a number for numeric comparison.
            values.push(isNaN(innerValue) ? innerValue : charwise.encode(Number(innerValue)));
        });

        return values.join("!");
    }

    async findInternal(query, sort) {
        const isRange = this.property.limit !== undefined;
        const indexes = this.property.indexes;
        const indexLen = isRange ? indexes.length - 1 : indexes.length;
        const queryValues = [];
        for (let i = 0; i < indexLen; ++i) {
            if (query[indexes[i]] !== undefined) {
                queryValues.push(query[indexes[i]]);
            }
        }
        const key = queryValues.join("!");
        if (isRange) {
            const rangeKey = indexes[indexes.length - 1];
            const from = query[rangeKey] && query[rangeKey].$gt > 0 ?
                Number(query[rangeKey].$gt) + 1 :
                1;
            const to = query[rangeKey] && query[rangeKey].$lt > 0 ?
                Number(query[rangeKey].$lt) - 1 :
                from + this.property.limit - 1;

            const gte = `${key}!${charwise.encode(Number(from))}`;
            const lte = `${key}!${charwise.encode(Number(to))}`;
            const valueStream = this.db.createValueStream({
                gte,
                lte,
                limit: this.property.limit,
            });

            return readStream(valueStream);
        } else {
            return new Promise((resolve, reject) => {
                this.db.get(key, (err, val) => {
                    if (err) {
                        if (err.notFound) {
                            resolve([]);
                        } else {
                            reject(err);
                        }
                    } else {
                        resolve([val]);
                    }
                });
            });
        }
    }
}
