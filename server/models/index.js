const sequelize = require('../config/sequelize')
const Todo = require('./todo')

const db = {
  sequelize,
  Todo,
}

module.exports = db
