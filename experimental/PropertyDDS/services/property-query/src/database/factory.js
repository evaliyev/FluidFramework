const { MongoDatabaseManager, MongoManager } = require("@fluidframework/server-services-core");
const { LevelDb } = require("./levelDb");


const mongoConfig = {
    "endpoint": "mongodb://mongodb:27017",
    "collectionNames": {
        "content": "content",
        "deltas": "deltas",
        "documents": "documents",
        "partitions": "partitions",
        "tenants": "tenants",
        "nodes": "nodes",
        "reservations": "reservations",
        "scribeDeltas": "scribeDeltas"
    }
};

const dbConfig = {
    "path": "/var/tmp/db"
};


const dbFactory = new LevelDb(dbConfig);
const mongoManager = new MongoManager(dbFactory);

const databaseManager = new MongoDatabaseManager(
    mongoManager,
    collectionNames.nodes,
    collectionNames.documents,
    collectionNames.deltas,
    collectionNames.scribeDeltas
);

module.exports = { databaseManager };
