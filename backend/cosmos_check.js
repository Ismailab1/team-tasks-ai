const cosmosModule = require('./cosmos0-1');
require('dotenv').config();

(async () => {
  try {
    const dbName = process.env.DATABASE_NAME || 'testdb';

    // 1. Test initializeDatabase
    console.log('Initializing database...');
    await cosmosModule.initializeDatabase(dbName);
    console.log('Database initialized successfully.');

    // 2. Test readContainer
    console.log('Reading users container...');
    const users = await cosmosModule.readContainer(dbName, 'users');
    console.log(`Users retrieved: ${users.length}`);

    // 2. Test createFamilyItem
    console.log('Creating test user...');
    const userItem = await cosmosModule.createFamilyItem(dbName, 'users', {
      id: 'test_user_001',
      username: 'testuser_cosmos',
      email: 'test_cosmos@example.com',
    });
    console.log('User created:', userItem);

    // 3. Test getUserByUsername
    console.log('Getting user by username...');
    const userByUsername = await cosmosModule.getUserByUsername(dbName, 'testuser_cosmos');
    console.log('Retrieved user:', userItem);

    // 4. Test getUserTeams
    console.log('Getting teams for user...');
    const teams = await cosmosModule.getUserTeams(dbName, 'test_user_001');
    console.log('User teams:', teams);

    // 5. Test getTeamMembers
    console.log('Getting members of team...');
    const members = await cosmosModule.getTeamMembers(dbName, 'team_id_example');
    console.log('Team members:', members);

    // 6. Test tasks creation
    console.log('Creating test task...');
    const task = await cosmosModule.createFamilyItem(dbName, 'tasks', {
      id: 'test_task_001',
      teamId: 'team_test_001',
      title: 'Test task from Cosmos test script',
    });
    console.log('Task created:', task);

    // 6. Test tasksByCreatedDate
    console.log('Retrieving tasks...');
    const tasks = await cosmosModule.tasksByCreatedDate(dbName, 'team_test_001');
    console.log('Tasks retrieved:', tasks);

    // 7. Test getUserTasks
    console.log('Getting tasks assigned to user...');
    const userTasks = await cosmosModule.getUserTasks(dbName, 'test_user_001');
    console.log('User tasks:', userTasks);

    // 7. Test getConversationHistory
    console.log('Checking conversation history...');
    const history = await cosmosModule.getConversationHistory(dbName, 'conversation_test_001');
    console.log('Conversation history:', history);

  } catch (error) {
    console.error('Error during Cosmos DB module checks:', error);
  }
})();
