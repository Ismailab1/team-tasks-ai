const teamTasksCosmos = require('./cosmos0-1.js');
const dummy = require('./dummyData.json');

const teamAid = "12345";
const teamBid = "23456";

// teamTasksCosmos.tasksByCreatedDate("tasks", "tasks", "23456").then((tasks) => {
//     console.log(tasks)
//   });
// teamTasksCosmos.createDatabase("tasks").then((msg) =>
// {
//   console.log(msg);
//   teamTasksCosmos.createContainer("tasks", "teamA").then(
//     (msg) => console.log(msg)
//   );
//   teamTasksCosmos.createContainer("tasks", "teamB").then(
//     (msg) => console.log(msg)
//   );
// });

// teamTasksCosmos.createDatabase("users").then((msg) =>
// {
//   console.log(msg);
//   teamTasksCosmos.createContainer("users", "teamA").then(
//     (msg) => console.log(msg)
//   );
//   teamTasksCosmos.createContainer("users", "teamB").then(
//     (msg) => console.log(msg)
//   );
// }
// );

// for (let i=1; i < 8; i++) {
//   u = dummy[`user${i}`];
//   container = u.teamId = teamAid ? "teamA" : "teamB";
//   teamTasksCosmos.createFamilyItem("users", container, u);
// }
// for (let i=1; i < 14; i++) {
//   t = dummy[`task${i}`];
//   container = t.teamId = teamAid ? "teamA" : "teamB";
//     teamTasksCosmos.createFamilyItem("tasks", container, t);
// }

teamTasksCosmos.readDatabase("tasks");
teamTasksCosmos.readDatabase("users");