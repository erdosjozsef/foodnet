const Sequelize = require("sequelize");
const db = {};

sequelize = new Sequelize("xxxxx", "xxxxx", "xxxxx", {
  dialect: "xxxxx",
  host: "xxxxx",
  port: 22680,
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = sequelize;
