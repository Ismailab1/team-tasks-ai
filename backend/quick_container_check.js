// quick_container_check.js
const { CosmosClient } = require('@azure/cosmos');
require('dotenv').config();

const client = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT,
  key: process.env.COSMOS_KEY,
});

async function checkContainers() {
  const db = client.database('testdb');
  const containerNames = ['users', 'tasks', 'teams', 'chatLogs', 'checkins', 'reports'];

  for (let name of containerNames) {
    const container = db.container(name);
    try {
      await container.read();
      console.log(`Container '${name}' exists.`);
    } catch (err) {
      console.error(`Container '${name}' NOT found:`, err.message);
    }
  }
}

checkContainers().catch(console.error);
