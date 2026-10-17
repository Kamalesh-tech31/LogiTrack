const DashboardStats = require("../models/DashboardStats")

exports.getDashboardStats = async (req, res) => {
  try {
    const stats = await DashboardStats.find().sort({ createdAt: -1 })
    const normalized = stats.map((item) => ({
      ...item.toObject(),
      totalItems: item.items,
      pendingOrders: item.pending,
      totalRevenue: item.revenue,
    }))
    res.status(200).json(normalized)
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch dashboard stats", error: error.message })
  }
}

exports.getDashboardStatsById = async (req, res) => {
  try {
    const stats = await DashboardStats.findById(req.params.id)
    if (!stats) {
      return res.status(404).json({ message: "Dashboard stats record not found" })
    }
    res.status(200).json(stats)
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch dashboard stats record", error: error.message })
  }
}

exports.createDashboardStats = async (req, res) => {
  try {
    const stats = new DashboardStats(req.body)
    const savedStats = await stats.save()
    res.status(201).json(savedStats)
  } catch (error) {
    res.status(500).json({ message: "Failed to create dashboard stats record", error: error.message })
  }
}

exports.updateDashboardStats = async (req, res) => {
  try {
    const updatedStats = await DashboardStats.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
    if (!updatedStats) {
      return res.status(404).json({ message: "Dashboard stats record not found" })
    }
    res.status(200).json(updatedStats)
  } catch (error) {
    res.status(500).json({ message: "Failed to update dashboard stats record", error: error.message })
  }
}

exports.deleteDashboardStats = async (req, res) => {
  try {
    const deletedStats = await DashboardStats.findByIdAndDelete(req.params.id)
    if (!deletedStats) {
      return res.status(404).json({ message: "Dashboard stats record not found" })
    }
    res.status(200).json({ message: "Dashboard stats record deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Failed to delete dashboard stats record", error: error.message })
  }
}
