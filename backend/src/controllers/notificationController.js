const Notification = require("../models/Notification");

async function getNotifications(req, res, next) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipient: userId }).sort({ createdAt: -1 }).limit(50).lean(),
      Notification.countDocuments({ recipient: userId, isRead: false }),
    ]);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function markNotificationRead(req, res, next) {
  try {
    const userId = req.user?._id || req.user?.id;
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: userId },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    res.json({
      success: true,
      data: {
        notification,
        unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function markAllNotificationsRead(req, res, next) {
  try {
    const userId = req.user?._id || req.user?.id;

    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } },
    );

    res.json({
      success: true,
      data: { unreadCount: 0 },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};