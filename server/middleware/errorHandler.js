function errorHandler(err, req, res, _next) {
  console.error('Error:', err.message)

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(422).json({
      success: false,
      message: '任务标题已存在',
      errors: err.errors.map((e) => ({
        field: e.path,
        message: '任务标题已存在',
      })),
    })
  }

  if (err.name === 'SequelizeValidationError') {
    return res.status(422).json({
      success: false,
      message: '输入验证失败',
      errors: err.errors.map((e) => ({
        field: e.path,
        message: e.message,
      })),
    })
  }

  res.status(500).json({
    success: false,
    message: '服务器内部错误',
  })
}

module.exports = errorHandler
