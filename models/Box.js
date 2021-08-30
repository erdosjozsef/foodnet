const Sequelize = require("sequelize");
const sequelize = require("../util/database");

const Box = sequelize.define("Box", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  price: {
    type: Sequelize.FLOAT,
    allowNull: false,
  },
  sku: Sequelize.STRING,
});

module.exports = Box;
