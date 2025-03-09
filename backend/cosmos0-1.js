
// load the Cosmos SDK & Client
const Cosmos = require('@azure/cosmos');
const CosmosClient = Cosmos.CosmosClient;

// a silly partition key
// TODO:: research this argument to the CosmosClient
const part_key = { kind : 'Hash', paths : ['/partitionKey'] }

// Load environment variables
require('dotenv').config(); 

// Fetch Cosmos Endpoint & Key from .env
const endpoint = process.env.COSMOS_ENDPOINT
const key = process.env.COSMOS_KEY

// Configure Options and Create Cosmos Client
const options = {
	endpoint : endpoint,
	key : key,
	userAgentSuffix : 'CosmosDB_Dev'
};
const client = new CosmosClient(options)

// create database from id if none exists already
// I don't think this is necessary for further dev
// I'll move it to an archive zone
async function createDatabase(db_id) {
	const { database } = await client.databases
																	 .createIfNotExists({id: db_id})
	// console.log(`Created DB: ${database.id}`)
  return `Created DB: ${database.id}`
}

async function createContainer(db_id, cont_id) {
  const { container } = await client.database(db_id)
                                   .containers
                                   .createIfNotExists({id: cont_id})
  // console.log(`Created container: ${container.id}`)
  return `Created container: ${container.id}`
}

// read the database, returns nothing
async function readDatabase(db_id) {
  try {
      // Connect to the database
      const database = client.database(db_id);
      
      // Fetch the list of all containers in the database
      const { resources: containers } = await database.containers.readAll().fetchAll();
      
      if (containers.length === 0) {
          console.log(`No containers found in the database with ID: ${db_id}`);
          return;
      }

      // Iterate over all containers and fetch data
      for (const container of containers) {
          console.log(`Reading data from container: ${container.id}`);
          const containerClient = database.container(container.id);
          
          // Fetch all items from the container
          const { resources: items } = await containerClient.items.readAll().fetchAll();
          
          // Log the items (you can process the data as per your needs)
          if (items.length > 0) {
              console.log(`Found ${items.length} items in container: ${container.id}`);
              console.log(items); // Print the items to the console
          } else {
              console.log(`No items found in container: ${container.id}`);
          }
      }
  } catch (error) {
      console.error("Error reading database:", error.message);
  }
}

// reads the container 
async function readContainer(databaseId, containerId) {
  const container = await client
    .database(databaseId)
    .container(containerId);
    
  const { resource: containerDefinition } = await container.read()

  const { resources: items } = await container.items.readAll().fetchAll()

  console.log(`Reading items from ${containerDefinition.id}`)

  return items
}

/*
TODO::
  1) create function to check for fields
  2) create function to ensure that item does not already exist
*/
async function createFamilyItem(databaseId, containerId, itemBody) {
  const { item } = await client
    .database(databaseId)
    .container(containerId)
    .items.upsert(itemBody)

    // TODO:: remove console log, replace with Azure logging
  console.log(`Created family item with id:\n${itemBody.id}\n`)
}

// gathers team_id primary keys from the Users Container
async function gatherTeamIds(db_id, cont_id) {
	
  const container = await client.database(db_id).container(cont_id);
	
  const q = `SELECT c.team_id FROM c`
	const qspec = {
		query: q
	}

	const { resources: items } = await container.items
																		 .query(qspec).fetchAll();
	console.log(items);
	return items;
}

async function tasksByCreatedDate(db_id, cont_id, team_id) {
  const container = await client
    .database(db_id)
    .container(cont_id);
  
    // this is very unsafe querying
  const q = `SELECT * FROM c WHERE c.teamId = "${team_id}" ORDER BY c.createdAt ASC`
  console.log(q)
  const qspec = {
    query: q
  }
  const { resources: items } = await container.items.query(qspec)
    .fetchAll();
  return items;
}

module.exports = { 
   tasksByCreatedDate, gatherTeamIds, createFamilyItem,
   readContainer, readDatabase, createDatabase, createContainer };