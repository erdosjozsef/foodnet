const Sequelize = require("sequelize");
const sequelize = require("../util/database");

const Extra = sequelize.define("Extra", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  extraType: Sequelize.INTEGER,
  sauces: Sequelize.INTEGER,
  price: {
    type: Sequelize.FLOAT,
    allowNull: false,
  },
});

module.exports = Extra;
