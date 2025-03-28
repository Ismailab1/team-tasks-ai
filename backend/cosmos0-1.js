require('dotenv').config();
const { CosmosClient } = require('@azure/cosmos');

const connectionString = process.env.COSMOS_DB_CONNECTION_STRING;
const databaseName = process.env.COSMOS_DB_DATABASE || 'testdb';

if (!connectionString) {
  throw new Error('❌ COSMOS_DB_CONNECTION_STRING is not defined in the environment variables.');
}

const client = new CosmosClient(connectionString);

async function initializeDatabase() {
  try {
    console.log('🔹 Initializing database...');
    const { database } = await client.databases.createIfNotExists({ id: databaseName });
    console.log(`✅ Database initialized: ${database.id}`);
    return database;
  } catch (error) {
    console.error('❌ Failed to initialize database:', error.message);
    throw error;
  }
}

async function createContainer(containerId) {
  try {
    const database = await initializeDatabase();
    const { container } = await database.containers.createIfNotExists({ id: containerId });
    console.log(`✅ Container initialized: ${container.id}`);
    return container;
  } catch (error) {
    console.error(`❌ Failed to create container (${containerId}):`, error.message);
    throw error;
  }
}

async function queryItems(containerId, query) {
  try {
    const database = await initializeDatabase();
    const container = database.container(containerId);
    const { resources } = await container.items.query(query).fetchAll();
    console.log(`✅ Query successful in container (${containerId}):`, resources);
    return resources;
  } catch (error) {
    console.error(`❌ Failed to query items in container (${containerId}):`, error.message);
    throw error;
  }
}

async function createItem(containerId, item) {
  try {
    const database = await initializeDatabase();
    const container = database.container(containerId);
    const { resource } = await container.items.create(item);
    console.log(`✅ Item created in container (${containerId}):`, resource);
    return resource;
  } catch (error) {
    console.error(`❌ Failed to create item in container (${containerId}):`, error.message);
    throw error;
  }
}

module.exports = {
  initializeDatabase,
  createContainer,
  queryItems,
  createItem,
};