/***********************************************************
 * cosmos0-1.js
 * 
 * Azure Cosmos DB helper module. Provides functions for:
 *  1) Reading / querying containers
 *  2) Creating/updating items
 *  3) Managing tasks by creation date
 * 
 * Used by appv1.js for CRUD operations in the 'users',
 * 'teams', 'tasks', 'chatLogs', and 'reports' containers.
 ***********************************************************/

const Cosmos = require('@azure/cosmos');
const CosmosClient = Cosmos.CosmosClient;
require('dotenv').config();

// Load Cosmos DB Endpoint & Key from .env
const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;

// Configure and instantiate the Cosmos Client
const options = {
  endpoint: endpoint,
  key: key,
  userAgentSuffix: 'CosmosDB_Dev'
};
const client = new CosmosClient(options);

/**
 * createDatabase(db_id)
 * Creates the database if it doesn't already exist.
 */
async function createDatabase(db_id) {
  const { database } = await client.databases.createIfNotExists({ id: db_id });
  return `Created or found DB: ${database.id}`;
}

/**
 * createContainer(db_id, cont_id)
 * Creates the specified container if it doesn't already exist.
 */
async function createContainer(db_id, cont_id) {
  const { container } = await client
    .database(db_id)
    .containers.createIfNotExists({ id: cont_id });
  return `Created or found container: ${container.id}`;
}

/**
 * readDatabase(db_id)
 * Reads all containers in a database and returns all items
 * from every container as a single array. 
 * Useful for debugging or quick data checks.
 */
async function readDatabase(db_id) {
  try {
    const database = client.database(db_id);
    const { resources: containers } = await database.containers.readAll().fetchAll();

    if (containers.length === 0) {
      console.log(`No containers found in DB: ${db_id}`);
      return [];
    }

    const allItems = [];
    for (const cont of containers) {
      const containerClient = database.container(cont.id);
      const { resources: items } = await containerClient.items.readAll().fetchAll();
      if (items.length > 0) {
        allItems.push(...items);
      }
    }
    return allItems;
  } catch (error) {
    console.error('Error reading database:', error.message);
    throw error;
  }
}

/**
 * readContainer(databaseId, containerId)
 * Reads and returns all items from a specific container.
 */
async function readContainer(databaseId, containerId) {
  try {
    const container = client.database(databaseId).container(containerId);
    // Confirm container exists
    await container.read();
    // Fetch all items
    const { resources: items } = await container.items.readAll().fetchAll();
    return items;
  } catch (error) {
    console.error(`Error reading container ${containerId}:`, error.message);
    throw error;
  }
}

/**
 * queryItems(databaseId, containerId, queryText)
 * Executes a custom SQL-like query (queryText) against a container.
 * Returns an array of items that match the query.
 */
async function queryItems(databaseId, containerId, queryText) {
  try {
    const container = client.database(databaseId).container(containerId);
    const querySpec = { query: queryText };
    const { resources: items } = await container.items.query(querySpec).fetchAll();
    return items;
  } catch (error) {
    console.error(`Error querying items in ${containerId}:`, error.message);
    throw error;
  }
}

/**
 * createFamilyItem(databaseId, containerId, itemBody)
 * Creates or updates (upsert) an item in a container.
 * Used by appv1.js for inserting new user records, chat messages, etc.
 */
async function createFamilyItem(databaseId, containerId, itemBody) {
  try {
    const { item } = await client
      .database(databaseId)
      .container(containerId)
      .items.upsert(itemBody);

    console.log(`Created/updated item with id: ${itemBody.id}`);
    return item;
  } catch (error) {
    console.error(`Error creating/updating item in ${containerId}:`, error.message);
    throw error;
  }
}

/**
 * tasksByCreatedDate(db_id, cont_id, team_id)
 * Returns tasks that match a given teamId, sorted by createdAt ascending.
 */
async function tasksByCreatedDate(db_id, cont_id, team_id) {
  try {
    const container = client.database(db_id).container(cont_id);
    const q = `SELECT * FROM c WHERE c.teamId = @teamId ORDER BY c.createdAt ASC`;
    const qspec = {
      query: q,
      parameters: [{ name: '@teamId', value: team_id }]
    };

    const { resources: items } = await container.items.query(qspec).fetchAll();
    return items;
  } catch (error) {
    console.error('Error fetching tasks by created date:', error.message);
    throw error;
  }
}

/**
 * gatherTeamIds(db_id, cont_id)
 * Example function to gather 'team_id' fields from a container.
 * Not used in the new code, but left here in case it's needed.
 */
async function gatherTeamIds(db_id, cont_id) {
  try {
    const container = client.database(db_id).container(cont_id);
    const q = `SELECT c.team_id FROM c`;
    const { resources: items } = await container.items.query({ query: q }).fetchAll();
    return items;
  } catch (error) {
    console.error('Error gathering team IDs:', error.message);
    throw error;
  }
}

/**
 * deleteItem(databaseId, containerId, itemId)
 * Finds an item by its ID and deletes it.
 */
async function deleteItem(databaseId, containerId, itemId) {
  try {
    const container = client.database(databaseId).container(containerId);

    // Fetch the item to get partition key if needed
    const { resources: items } = await container.items.query({
      query: `SELECT * FROM c WHERE c.id = "${itemId}"`
    }).fetchAll();

    if (items.length === 0) {
      throw new Error(`Item with id ${itemId} not found`);
    }

    // Then delete it
    await container.item(itemId).delete();
    console.log(`Deleted item with id: ${itemId}`);
    return true;
  } catch (error) {
    console.error('Error deleting item:', error.message);
    throw error;
  }
}

// Export all functions used by appv1.js
module.exports = {
  tasksByCreatedDate,
  gatherTeamIds,
  createFamilyItem,
  readContainer,
  readDatabase,
  createDatabase,
  createContainer,
  queryItems,
  deleteItem
};
