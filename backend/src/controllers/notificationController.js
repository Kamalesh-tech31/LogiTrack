const Notification = require("../models/Notification");

const NOTIFICATION_TYPES_BY_ROLE = {
  "Business Owner": new Set([
    "order-placed",
    "order-created",
    "order-assigned",
    "order-shipped",
    "order-delivered",
    "order-completed",
    "order-cancelled",
    "product-added",
    "product-updated",
    "product-stock-low",
    "delivery-agent-added",
  ]),
  Customer: new Set([
    "order-placed",
    "order-created",
    "order-shipped",
    "order-delivered",
    "order-completed",
    "order-cancelled",
  ]),
  "Delivery Agent": new Set([
    "order-created",
    "order-assigned",
    "order-shipped",
    "order-delivered",
    "order-completed",
    "order-cancelled",
  ]),
};

function normalizeCustomerNotification(notification) {
  if (notification.type !== "order-created") {
    return notification;
  }

  return {
    ...notification,
    type: "order-placed",
    title: "Order placed",
    message: notification.message.replace("has been created", "has been placed"),
  };
}

async function getNotifications(req, res, next) {
  try {
    const userId = req.user?._id || req.user?.id;
    const role = req.user?.role;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const allowedTypes = NOTIFICATION_TYPES_BY_ROLE[role] || new Set();

    const filter = {
      recipient: userId,
      recipientRole: role,
      type: { $in: Array.from(allowedTypes) },
    };

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).limit(50).lean(),
      Notification.countDocuments({ ...filter, isRead: false }),
    ]);

    res.json({
      success: true,
      data: {
        notifications:
          role === "Customer"
            ? notifications.map(normalizeCustomerNotification)
            : notifications,
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
    const role = req.user?.role;
    const { id } = req.params;

    const allowedTypes = NOTIFICATION_TYPES_BY_ROLE[role] || new Set();

    const notification = await Notification.findOneAndUpdate(
      {
        _id: id,
        recipient: userId,
        recipientRole: role,
        type: { $in: Array.from(allowedTypes) },
      },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      recipientRole: role,
      type: { $in: Array.from(allowedTypes) },
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
    const role = req.user?.role;
    const allowedTypes = NOTIFICATION_TYPES_BY_ROLE[role] || new Set();

    await Notification.updateMany(
      {
        recipient: userId,
        recipientRole: role,
        type: { $in: Array.from(allowedTypes) },
        isRead: false,
      },
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