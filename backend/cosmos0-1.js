/***********************************************************
 * cosmos0-1.js
 * 
 * Azure Cosmos DB helper module. Provides functions for:
 *  1) Reading / querying containers
 *  2) Creating/updating items
 *  3) Managing tasks by creation date
 *  4) Supporting user, team, task, chat, check-in, and report operations
 * 
 * Used by appv1.js for CRUD operations in the 'users',
 * 'teams', 'tasks', 'chatLogs', 'checkins', and 'reports' containers.
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
 * createContainer(db_id, cont_id, partitionKeyPath)
 * Creates the specified container if it doesn't already exist.
 * Now supports specifying a partition key path.
 */
async function createContainer(db_id, cont_id, partitionKeyPath = '/id') {
  const { container } = await client
    .database(db_id)
    .containers.createIfNotExists({ 
      id: cont_id,
      partitionKey: {
        paths: [partitionKeyPath]
      }
    });
  return `Created or found container: ${container.id}`;
}

/**
 * initializeDatabase(db_id)
 * Creates the database and all necessary containers for the application.
 */
async function initializeDatabase(db_id) {
  try {
    // First create the database
    await createDatabase(db_id);
    
    // Then create all required containers with appropriate partition keys
    await createContainer(db_id, 'users', '/id');
    await createContainer(db_id, 'teams', '/id');
    await createContainer(db_id, 'tasks', '/teamId');
    await createContainer(db_id, 'chatLogs', '/conversationId');
    await createContainer(db_id, 'checkins', '/teamId');
    await createContainer(db_id, 'reports', '/teamId');
    
    console.log(`Database ${db_id} and all required containers initialized.`);
    return true;
  } catch (error) {
    console.error('Error initializing database:', error.message);
    throw error;
  }
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
 * queryItems(databaseId, containerId, queryText, parameters = [])
 * Executes a custom SQL-like query (queryText) against a container.
 * Now supports parameterized queries for better security and performance.
 * Returns an array of items that match the query.
 */
async function queryItems(databaseId, containerId, queryText, parameters = []) {
  try {
    const container = client.database(databaseId).container(containerId);
    const querySpec = { 
      query: queryText,
      parameters: parameters
    };
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
    // Ensure timestamps are set for creation/updates
    if (!itemBody.createdAt) {
      itemBody.createdAt = new Date().toISOString();
    }
    itemBody.updatedAt = new Date().toISOString();

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
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.teamId = @teamId ORDER BY c.createdAt ASC',
      parameters: [{ name: '@teamId', value: team_id }]
    };

    const { resources: items } = await container.items
      .query(querySpec, { partitionKey: team_id })
      .fetchAll();

    return items;
  } catch (error) {
    console.error('Error fetching tasks by created date:', error.message);
    throw error;
  }
}



/**
 * getItemById(databaseId, containerId, itemId, partitionKey = null)
 * Gets a specific item by ID. If partitionKey is not provided, 
 * it will first query to find the item details.
 */
async function getItemById(databaseId, containerId, itemId, partitionKey = null) {
  try {
    const container = client.database(databaseId).container(containerId);
    
    // If we don't have the partition key, we need to query for it
    if (!partitionKey) {
      const query = `SELECT * FROM c WHERE c.id = @itemId`;
      const { resources: items } = await container.items.query({
        query: query,
        parameters: [{ name: '@itemId', value: itemId }]
      }).fetchAll();
      
      if (items.length === 0) {
        return null;
      }
      
      return items[0];
    }
    
    // If we have the partition key, we can read directly
    const { resource: item } = await container.item(itemId, partitionKey).read();
    return item;
  } catch (error) {
    console.error(`Error getting item by ID from ${containerId}:`, error.message);
    throw error;
  }
}

/**
 * deleteItem(databaseId, containerId, itemId, partitionKey = null)
 * Finds an item by its ID and deletes it.
 */
async function deleteItem(databaseId, containerId, itemId, partitionKey = null) {
  try {
    const container = client.database(databaseId).container(containerId);

    // If partition key wasn't provided, we need to fetch it
    if (!partitionKey) {
      const { resources: items } = await container.items.query({
        query: `SELECT * FROM c WHERE c.id = @itemId`,
        parameters: [{ name: '@itemId', value: itemId }]
      }).fetchAll();

      if (items.length === 0) {
        throw new Error(`Item with id ${itemId} not found`);
      }
      
      // Extract partition key based on the container
      switch (containerId) {
        case 'tasks':
          partitionKey = items[0].teamId;
          break;
        case 'chatLogs':
          partitionKey = items[0].conversationId;
          break;
        case 'checkins':
          partitionKey = items[0].userId;
          break;
        case 'reports':
          partitionKey = items[0].teamId;
          break;
        default:
          partitionKey = items[0].id;
      }
    }

    // Then delete it
    await container.item(itemId, partitionKey).delete();
    console.log(`Deleted item with id: ${itemId}`);
    return true;
  } catch (error) {
    console.error('Error deleting item:', error.message);
    throw error;
  }
}

/**
 * getUserByUsername(databaseId, username)
 * Get a user by their username - used for authentication
 */
async function getUserByUsername(databaseId, username) {
  try {
    const query = `SELECT * FROM c WHERE c.username = @username`;
    const items = await queryItems(
      databaseId, 
      'users', 
      query,
      [{ name: '@username', value: username }]
    );
    
    return items.length > 0 ? items[0] : null;
  } catch (error) {
    console.error('Error fetching user by username:', error.message);
    throw error;
  }
}

/**
 * getUserTeams(databaseId, userId)
 * Get all teams that a user is a member of
 */
async function getUserTeams(databaseId, userId) {
  try {
    const query = `SELECT * FROM c WHERE ARRAY_CONTAINS(c.members, @userId)`;
    return await queryItems(
      databaseId, 
      'teams', 
      query,
      [{ name: '@userId', value: userId }]
    );
  } catch (error) {
    console.error('Error fetching user teams:', error.message);
    throw error;
  }
}

/**
 * getUserTasks(databaseId, userId)
 * Get all tasks assigned to a specific user
 */
async function getUserTasks(databaseId, userId) {
  try {
    const query = `SELECT * FROM c WHERE c.assignedTo = @userId ORDER BY c.createdAt DESC`;
    return await queryItems(
      databaseId, 
      'tasks', 
      query,
      [{ name: '@userId', value: userId }]
    );
  } catch (error) {
    console.error('Error fetching user tasks:', error.message);
    throw error;
  }
}

/**
 * getTeamMembers(databaseId, teamId)
 * Gets all user details for members of a specific team
 */
async function getTeamMembers(databaseId, teamId) {
  try {
    // First get the team to obtain member IDs
    const team = await getItemById(databaseId, 'teams', teamId);
    
    if (!team || !team.members || !Array.isArray(team.members)) {
      return [];
    }
    
    // Then query for all those users
    if (team.members.length === 0) {
      return [];
    }
    
    // Build a query that uses IN operator to get all members at once
    const memberIds = team.members.map(id => `"${id}"`).join(',');
    const query = `SELECT * FROM c WHERE c.id IN (${memberIds})`;
    
    return await queryItems(databaseId, 'users', query);
  } catch (error) {
    console.error('Error fetching team members:', error.message);
    throw error;
  }
}

/**
 * getConversationHistory(databaseId, conversationId)
 * Gets all chat messages for a specific conversation, ordered by timestamp
 */
async function getConversationHistory(databaseId, conversationId) {
  try {
    const query = `SELECT * FROM c WHERE c.conversationId = @conversationId ORDER BY c.timestamp ASC`;
    return await queryItems(
      databaseId, 
      'chatLogs', 
      query,
      [{ name: '@conversationId', value: conversationId }]
    );
  } catch (error) {
    console.error('Error fetching conversation history:', error.message);
    throw error;
  }
}

/**
 * getUserCheckins(databaseId, userId, limit = 10)
 * Gets the most recent check-ins for a specific user
 */
async function getUserCheckins(databaseId, userId, limit = 10) {
  try {
    const query = `SELECT TOP ${limit} * FROM c WHERE c.userId = @userId ORDER BY c.timestamp DESC`;
    return await queryItems(
      databaseId, 
      'checkins', 
      query,
      [{ name: '@userId', value: userId }]
    );
  } catch (error) {
    console.error('Error fetching user check-ins:', error.message);
    throw error;
  }
}

/**
 * getTaskAttachments(databaseId, taskId)
 * Gets the file paths for all attachments associated with a task
 */
async function getTaskAttachments(databaseId, taskId) {
  try {
    const task = await getItemById(databaseId, 'tasks', taskId);
    return task && task.taskImage ? [task.taskImage] : [];
  } catch (error) {
    console.error('Error fetching task attachments:', error.message);
    throw error;
  }
}

// Export all functions used by appv1.js
module.exports = {
  // Database setup
  createDatabase,
  createContainer,
  initializeDatabase,
  
  // Basic CRUD operations
  readDatabase,
  readContainer,
  queryItems,
  createFamilyItem,
  getItemById,
  deleteItem,
  
  // Task-specific operations
  tasksByCreatedDate,
  
  // User authentication and management operations
  getUserByUsername,
  getUserTeams,
  getUserTasks,
  
  // Team operations
  getTeamMembers,
  
  // Chat and messaging operations
  getConversationHistory,
  
  // Check-in operations  
  getUserCheckins,
  
  // File attachment operations
  getTaskAttachments
};