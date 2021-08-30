const Sequelize = require("sequelize");
const sequelize = require("../util/database");

const Order = sequelize.define("Order", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  totalPrice: {
    type: Sequelize.FLOAT,
    allowNull: false,
  },
  cutlery: Sequelize.INTEGER,
  lang: Sequelize.STRING,
  take: Sequelize.INTEGER,
  orderType: Sequelize.INTEGER,
  deletedMessage: Sequelize.STRING,
  messageCourier: Sequelize.STRING,
  encodedKey: Sequelize.STRING,
  deliveryPrice: Sequelize.FLOAT,
  mobile: Sequelize.INTEGER,
  web: Sequelize.INTEGER,
  courierId: Sequelize.INTEGER,
  restaurantAdded: Sequelize.INTEGER,
});

module.exports = Order;
