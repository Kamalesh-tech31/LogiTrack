const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      if (schema) {
        const { error, value } = schema.validate(req.body)
        if (error) {
          return res.status(400).json({ message: "Validation failed", error: error.details })
        }
        req.body = value
      }
      next()
    } catch (err) {
      res.status(400).json({ message: "Request validation error", error: err.message })
    }
  }
}

module.exports = validateRequest
