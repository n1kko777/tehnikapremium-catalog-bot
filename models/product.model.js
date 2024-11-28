const Sequelize = require("sequelize");
const sequelize = require("../database");

const Product = sequelize.define(
  "product",
  {
    imgSrc: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    linkKz: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    link: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    category: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    title: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    price: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    priceRubOpt: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    priceRubRozn: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    status: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    delivery: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    date: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    article: {
      type: Sequelize.STRING,
      unique: true,
      primaryKey: true,
    },
  },
  {
    timestamps: false, // Если у вас нет полей createdAt и updatedAt
  }
);

module.exports = { Product };
