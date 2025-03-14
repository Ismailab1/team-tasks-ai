/***********************************************************
 * cosmos0-1.js - CosmosDB Helper Functions
 ***********************************************************/

const Cosmos = require('@azure/cosmos');
const { CosmosClient } = Cosmos;
require('dotenv').config();

// Load credentials from .env
const connectionString = process.env.COSMOS_DB_CONNECTION_STRING;
const databaseId = process.env.COSMOS_DB_DATABASE;

if (!connectionString || !databaseId) {
    throw new Error("Missing Cosmos DB configuration in environment variables");
}

// Initialize Cosmos Client
const client = new CosmosClient(connectionString);

// Function to get container reference
async function getContainer() {
    const { database } = await client.databases.createIfNotExists({ id: databaseId });
    const { container } = await database.containers.createIfNotExists({ id: containerId });
    return container;
}

/** Initialize the database */
async function initializeDatabase(db_id) {
    try {
        console.log("🚀 Initializing database and containers...");

        await client.databases.createIfNotExists({ id: db_id });

        // Create containers
        await createContainer(db_id, 'users', '/id');
        await createContainer(db_id, 'teams', '/id');
        await createContainer(db_id, 'tasks', '/teamId');
        await createContainer(db_id, 'chatLogs', '/conversationId');
        await createContainer(db_id, 'checkins', '/teamId');
        await createContainer(db_id, 'reports', '/teamId');

        console.log(`🎉 Database ${db_id} initialized successfully.`);
        return true;
    } catch (error) {
        console.error('❌ Error initializing database:', error.message);
        throw error;
    }
}

/** Create container */
async function createContainer(db_id, cont_id, partitionKeyPath = '/id') {
    try {
        const { container } = await client.database(db_id).containers.createIfNotExists({
            id: cont_id,
            partitionKey: { paths: [partitionKeyPath] }
        });
        console.log(`✅ Created or found container: ${container.id}`);
        return container;
    } catch (error) {
        console.error(`❌ Error creating container ${cont_id}:`, error.message);
        throw error;
    }
}

/** Query items in a container */
async function queryItems(databaseId, containerId, queryText, parameters = []) {
    try {
        const container = client.database(databaseId).container(containerId);
        const querySpec = { query: queryText, parameters };
        const { resources: items } = await container.items.query(querySpec).fetchAll();
        return items;
    } catch (error) {
        console.error(`❌ Error querying items in ${containerId}:`, error.message);
        throw error;
    }
}

/** Create or update an item */
async function createFamilyItem(databaseId, containerId, itemBody) {
    try {
        itemBody.createdAt = itemBody.createdAt || new Date().toISOString();
        itemBody.updatedAt = new Date().toISOString();

        const { resource } = await client.database(databaseId).container(containerId).items.upsert(itemBody);
        return resource; // Ensure returning a serializable object
    } catch (error) {
        console.error(`❌ Error creating/updating item in ${containerId}:`, error.message);
        throw error;
    }
}

/** Fetch user by username */
async function getUserByUsername(databaseId, username) {
    try {
        return (await queryItems(databaseId, 'users', 
            `SELECT * FROM c WHERE c.username = @username`, 
            [{ name: '@username', value: username }]
        ))[0] || null;
    } catch (error) {
        console.error(`❌ Error fetching user by username:`, error.message);
        throw error;
    }
}

/** Fetch teams for a user */
async function getUserTeams(databaseId, userId) {
    try {
        return await queryItems(databaseId, 'teams', 
            `SELECT * FROM c WHERE ARRAY_CONTAINS(c.members, @userId)`, 
            [{ name: '@userId', value: userId }]
        );
    } catch (error) {
        console.error(`❌ Error fetching user teams:`, error.message);
        throw error;
    }
}

/** Fetch tasks created by team */
async function tasksByCreatedDate(databaseId, containerId, teamId) {
    try {
        return await queryItems(databaseId, containerId, 
            `SELECT * FROM c WHERE c.teamId = @teamId ORDER BY c.createdAt DESC`, 
            [{ name: '@teamId', value: teamId }]
        );
    } catch (error) {
        console.error(`❌ Error fetching tasks by created date:`, error.message);
        throw error;
    }
}

/** Fetch tasks assigned to a user */
async function getUserTasks(databaseId, userId) {
    try {
        return await queryItems(databaseId, 'tasks', 
            `SELECT * FROM c WHERE c.assignedTo = @userId`, 
            [{ name: '@userId', value: userId }]
        );
    } catch (error) {
        console.error(`❌ Error fetching tasks assigned to user:`, error.message);
        throw error;
    }
}

/** Fetch conversation history */
async function getConversationHistory(databaseId, conversationId) {
    try {
        return await queryItems(databaseId, 'chatLogs', 
            `SELECT * FROM c WHERE c.conversationId = @conversationId ORDER BY c.timestamp ASC`, 
            [{ name: '@conversationId', value: conversationId }]
        );
    } catch (error) {
        console.error(`❌ Error fetching conversation history:`, error.message);
        throw error;
    }
}

// Export functions
module.exports = {
    initializeDatabase,
    createContainer,
    queryItems,
    createFamilyItem,
    getUserByUsername,
    getUserTeams,
    tasksByCreatedDate,
    getUserTasks,
    getConversationHistory
};
