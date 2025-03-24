const { CosmosClient } = require('@azure/cosmos');
require('dotenv').config();

async function initializeDatabase() {
  try {
    console.log('🔄 Initializing CosmosDB...');

    const endpoint = process.env.COSMOS_DB_ENDPOINT;
    const key = process.env.COSMOS_DB_KEY;
    const dbName = process.env.COSMOS_DB_DATABASE || "testdb";

    if (!endpoint || !key) {
      throw new Error("❌ CosmosDB credentials missing. Check COSMOS_ENDPOINT and COSMOS_KEY in .env");
    }

    // Create a CosmosClient
    const client = new CosmosClient({ endpoint, key });

    // Ensure the database exists
    const { database } = await client.databases.createIfNotExists({ id: dbName });

    // Define container settings
    const containers = [
      { id: "users", partitionKey: { kind: "Hash", paths: ["/id"] } },
      { id: "teams", partitionKey: { kind: "Hash", paths: ["/id"] } },
      { id: "tasks", partitionKey: { kind: "Hash", paths: ["/teamId"] } },
      { id: "chatLogs", partitionKey: { kind: "Hash", paths: ["/conversationId"] } },
      { id: "checkins", partitionKey: { kind: "Hash", paths: ["/teamId"] } },
      { id: "reports", partitionKey: { kind: "Hash", paths: ["/teamId"] } }
    ];

    // Ensure each container exists
    for (const container of containers) {
      await database.containers.createIfNotExists({ id: container.id, partitionKey: container.partitionKey });
      console.log(`✅ Container "${container.id}" is ready`);
    }

    console.log(`✅ Database "${dbName}" initialized successfully`);
    return database;
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  }
}

module.exports = { initializeDatabase };
