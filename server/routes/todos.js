const express = require('express')
const { body, param, query, validationResult } = require('express-validator')
const { Todo } = require('../models')

const router = express.Router()

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: '输入验证失败',
      errors: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    })
  }
  next()
}

// GET /todos
router.get(
  '/',
  query('status').optional().isIn(['all', 'active', 'completed']),
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { status = 'all' } = req.query
      const where = {}

      if (status === 'active') {
        where.is_completed = false
      } else if (status === 'completed') {
        where.is_completed = true
      }

      const todos = await Todo.findAll({
        where,
        order: [['created_at', 'DESC']],
      })

      res.json({ success: true, data: todos })
    } catch (err) {
      next(err)
    }
  }
)

// GET /todos/:id
router.get(
  '/:id',
  param('id').isInt({ min: 1 }),
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const todo = await Todo.findByPk(req.params.id)

      if (!todo) {
        return res.status(404).json({ success: false, message: '任务不存在' })
      }

      res.json({ success: true, data: todo })
    } catch (err) {
      next(err)
    }
  }
)

// POST /todos
router.post(
  '/',
  body('title').trim().notEmpty().withMessage('标题不能为空').isLength({ max: 255 }).withMessage('标题最多255个字符'),
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const todo = await Todo.create({ title: req.body.title })
      res.status(201).json({ success: true, data: todo, message: '任务创建成功' })
    } catch (err) {
      next(err)
    }
  }
)

// PUT /todos/:id
router.put(
  '/:id',
  param('id').isInt({ min: 1 }),
  body('title').optional().trim().notEmpty().withMessage('标题不能为空').isLength({ max: 255 }).withMessage('标题最多255个字符'),
  body('is_completed').optional().isBoolean().withMessage('完成状态必须是布尔值'),
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const todo = await Todo.findByPk(req.params.id)

      if (!todo) {
        return res.status(404).json({ success: false, message: '任务不存在' })
      }

      const { title, is_completed } = req.body
      const updates = {}

      if (title !== undefined) updates.title = title
      if (is_completed !== undefined) updates.is_completed = is_completed

      await todo.update(updates)
      res.json({ success: true, data: todo, message: '任务更新成功' })
    } catch (err) {
      next(err)
    }
  }
)

// DELETE /todos/:id
router.delete(
  '/:id',
  param('id').isInt({ min: 1 }),
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const todo = await Todo.findByPk(req.params.id)

      if (!todo) {
        return res.status(404).json({ success: false, message: '任务不存在' })
      }

      await todo.destroy()
      res.json({ success: true, message: '任务删除成功' })
    } catch (err) {
      next(err)
    }
  }
)

// POST /todos/batch/delete
router.post(
  '/batch/delete',
  body('ids').isArray({ min: 1 }).withMessage('ids 必须是非空数组'),
  body('ids.*').isInt({ min: 1 }),
  handleValidationErrors,
  async (req, res, next) => {
    try {
      await Todo.destroy({ where: { id: req.body.ids } })
      res.json({ success: true, message: '批量删除成功' })
    } catch (err) {
      next(err)
    }
  }
)

// POST /todos/batch/complete
router.post(
  '/batch/complete',
  body('ids').isArray({ min: 1 }).withMessage('ids 必须是非空数组'),
  body('ids.*').isInt({ min: 1 }),
  handleValidationErrors,
  async (req, res, next) => {
    try {
      await Todo.update(
        { is_completed: true },
        { where: { id: req.body.ids } }
      )
      res.json({ success: true, message: '批量完成成功' })
    } catch (err) {
      next(err)
    }
  }
)

module.exports = router
