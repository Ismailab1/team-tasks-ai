require('dotenv').config();
const { CosmosClient } = require('@azure/cosmos');
const client = new CosmosClient(process.env.COSMOS_DB_CONNECTION_STRING);

describe('Cosmos DB Connection Test', () => {
  test('Should connect to Cosmos DB and create test database', async () => {
    try {
      const { database } = await client.databases.createIfNotExists({ id: 'testdb' });
      console.log('✅ Connected to Cosmos DB:', database.id);
      expect(database.id).toBe('testdb'); // Assert that the database ID is correct
    } catch (error) {
      console.error('❌ Failed to connect to Cosmos DB:', error.message);
      throw error; // Fail the test if an error occurs
    }
  });
});