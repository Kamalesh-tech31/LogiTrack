const CustomerAnalytics = require("../models/CustomerAnalytics")
const Order = require("../models/Order")

function getMonthKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
}

function getMonthLabel(monthKey) {
  const [year, month] = monthKey.split("-").map(Number)
  return new Date(year, month - 1, 1).toLocaleString("en-US", {
    month: "short",
    year: "2-digit",
  })
}

async function buildCustomerAnalyticsSummary(userId) {
  const orders = await Order.find({ customerId: userId }).sort({ createdAt: 1 })

  const totalOrders = orders.length
  const deliveredOrders = orders.filter((order) => {
    const status = String(order.status || "").toLowerCase()
    return status === "delivered" || status === "completed"
  }).length
  const pendingOrders = orders.filter((order) => {
    const status = String(order.status || "").toLowerCase()
    return status === "pending" || status === "processing" || status === "assigned"
  }).length
  const shippedOrders = orders.filter((order) => String(order.status || "").toLowerCase() === "shipped").length

  const totalSpending = orders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0)

  const monthlyMap = new Map()
  const spendingMap = new Map()
  const statusMap = new Map([
    ["pending", 0],
    ["processing", 0],
    ["assigned", 0],
    ["shipped", 0],
    ["delivered", 0],
    ["completed", 0],
    ["cancelled", 0],
  ])

  orders.forEach((order) => {
    const createdAt = new Date(order.createdAt || order.updatedAt || Date.now())
    const monthKey = getMonthKey(createdAt)
    monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + 1)
    spendingMap.set(monthKey, (spendingMap.get(monthKey) || 0) + Number(order.totalPrice || 0))

    const status = String(order.status || "pending").toLowerCase()
    statusMap.set(status, (statusMap.get(status) || 0) + 1)
  })

  const lastSixMonths = []
  const cursor = new Date()
  cursor.setDate(1)
  cursor.setHours(0, 0, 0, 0)
  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date(cursor.getFullYear(), cursor.getMonth() - index, 1)
    const monthKey = getMonthKey(date)
    lastSixMonths.push(monthKey)
  }

  const monthlyStats = lastSixMonths.map((monthKey) => ({
    month: getMonthLabel(monthKey),
    monthKey,
    orders: monthlyMap.get(monthKey) || 0,
    spending: spendingMap.get(monthKey) || 0,
  }))

  const orderStatusDistribution = Array.from(statusMap.entries())
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({ name, value }))

  return {
    totalOrders,
    deliveredOrders,
    pendingOrders,
    shippedOrders,
    totalSpending,
    monthlyStats,
    orderStatusDistribution,
  }
}

exports.getAnalytics = async (req, res) => {
  try {
    const analytics = await CustomerAnalytics.find().sort({ createdAt: -1 })
    res.status(200).json(analytics)
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch analytics", error: error.message })
  }
}

exports.getAnalyticsById = async (req, res) => {
  try {
    const analytics = await CustomerAnalytics.findById(req.params.id)
    if (!analytics) {
      return res.status(404).json({ message: "Analytics record not found" })
    }
    res.status(200).json(analytics)
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch analytics record", error: error.message })
  }
}

exports.createAnalytics = async (req, res) => {
  try {
    const analytics = new CustomerAnalytics(req.body)
    const savedAnalytics = await analytics.save()
    res.status(201).json(savedAnalytics)
  } catch (error) {
    res.status(500).json({ message: "Failed to create analytics record", error: error.message })
  }
}

exports.updateAnalytics = async (req, res) => {
  try {
    const updatedAnalytics = await CustomerAnalytics.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
    if (!updatedAnalytics) {
      return res.status(404).json({ message: "Analytics record not found" })
    }
    res.status(200).json(updatedAnalytics)
  } catch (error) {
    res.status(500).json({ message: "Failed to update analytics record", error: error.message })
  }
}

exports.deleteAnalytics = async (req, res) => {
  try {
    const deletedAnalytics = await CustomerAnalytics.findByIdAndDelete(req.params.id)
    if (!deletedAnalytics) {
      return res.status(404).json({ message: "Analytics record not found" })
    }
    res.status(200).json({ message: "Analytics record deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Failed to delete analytics record", error: error.message })
  }
}

exports.getCustomerAnalyticsSummary = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    const summary = await buildCustomerAnalyticsSummary(userId)
    res.status(200).json(summary)
  } catch (error) {
    res.status(500).json({ message: "Failed to load customer analytics", error: error.message })
  }
}
