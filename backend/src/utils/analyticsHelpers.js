const calculateOrderStats = (orders) => {
  const total = orders.length
  const delivered = orders.filter((o) => o.status === "delivered").length
  const shipped = orders.filter((o) => o.status === "shipped").length
  const pending = orders.filter((o) => o.status === "pending").length
  const totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0)

  return {
    total,
    delivered,
    shipped,
    pending,
    totalRevenue,
  }
}

const calculateCategoryStats = (products) => {
  const categories = {}

  products.forEach((product) => {
    if (!categories[product.category]) {
      categories[product.category] = { count: 0, totalRevenue: 0 }
    }
    categories[product.category].count += 1
  })

  return categories
}

const generateAnalyticsTrend = (data, period = "monthly") => {
  const trend = {}

  data.forEach((item) => {
    const date = new Date(item.date || item.createdAt)
    let key

    if (period === "daily") {
      key = date.toISOString().split("T")[0]
    } else if (period === "weekly") {
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      key = weekStart.toISOString().split("T")[0]
    } else {
      key = date.toISOString().split("-").slice(0, 2).join("-")
    }

    if (!trend[key]) {
      trend[key] = 0
    }
    trend[key] += 1
  })

  return Object.entries(trend).map(([label, value]) => ({ label, value }))
}

module.exports = {
  calculateOrderStats,
  calculateCategoryStats,
  generateAnalyticsTrend,
}
