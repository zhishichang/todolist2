const { DataTypes } = require('sequelize')
const sequelize = require('../config/sequelize')

const Todo = sequelize.define('Todo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [1, 255],
    },
  },
  is_completed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  paranoid: true,
  tableName: 'todos',
})

module.exports = Todo
