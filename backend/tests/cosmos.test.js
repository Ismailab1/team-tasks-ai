require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const cosmosModule = require('../cosmos0-1');

const TEST_DB = process.env.COSMOS_DB_DATABASE || 'testdb';
const TEST_CONTAINER = 'testContainer';
const TEST_ITEM = {
  id: uuidv4(),
  name: 'Test Item',
  description: 'This is a test item.',
  createdAt: new Date().toISOString(),
};

beforeAll(async () => {
  console.log('🔹 Initializing test setup...');
  try {
    // Initialize the database and container
    await cosmosModule.initializeDatabase();
    await cosmosModule.createContainer(TEST_CONTAINER);
    console.log('✅ Test setup completed.');
  } catch (error) {
    console.error('❌ Failed to initialize test setup:', error.message);
    throw error;
  }
});

afterAll(() => {
  console.log('🛑 Test suite completed.');
});

describe('Cosmos DB Module Tests', () => {
  test('Should initialize database', async () => {
    const database = await cosmosModule.initializeDatabase();
    expect(database.id).toBe(TEST_DB);
  });

  test('Should create a container', async () => {
    const container = await cosmosModule.createContainer(TEST_CONTAINER);
    expect(container.id).toBe(TEST_CONTAINER);
  });

  test('Should create an item in the container', async () => {
    const item = await cosmosModule.createItem(TEST_CONTAINER, TEST_ITEM);
    expect(item).toHaveProperty('id', TEST_ITEM.id);
    expect(item).toHaveProperty('name', TEST_ITEM.name);
  });

  test('Should query items from the container', async () => {
    const query = `SELECT * FROM c WHERE c.id = "${TEST_ITEM.id}"`;
    const items = await cosmosModule.queryItems(TEST_CONTAINER, query);
    expect(items.length).toBe(1);
    expect(items[0]).toHaveProperty('id', TEST_ITEM.id);
  });
});