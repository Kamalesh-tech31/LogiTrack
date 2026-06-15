const Notification = require("../models/Notification");

function createRoleNotification({
  recipient,
  recipientRole,
  type,
  title,
  message,
  orderId = null,
  orderCode = null,
  metadata = {},
}) {
  if (!recipient || !recipientRole) {
    return null;
  }

  return Notification.create({
    recipient,
    recipientRole,
    type,
    title,
    message,
    orderId,
    orderCode,
    metadata,
  });
}

function getRecipients(order, includeAgent = true) {
  const recipients = [];

  if (order.customerId) {
    recipients.push({ recipient: order.customerId, recipientRole: "Customer" });
  }

  if (order.ownerId) {
    recipients.push({ recipient: order.ownerId, recipientRole: "Business Owner" });
  }

  if (includeAgent && order.assignedAgent) {
    recipients.push({ recipient: order.assignedAgent, recipientRole: "Delivery Agent" });
  }

  return recipients;
}

async function createNotificationForRecipients(order, config, options = {}) {
  const recipients = getRecipients(order, options.includeAgent !== false);
  if (!recipients.length) {
    return [];
  }

  return Promise.all(
    recipients.map((recipientInfo) =>
      Notification.create({
        recipient: recipientInfo.recipient,
        recipientRole: recipientInfo.recipientRole,
        type: config.type,
        title: config.title,
        message: config.message,
        orderId: order._id,
        orderCode: order.orderId,
        metadata: {
          status: order.status,
          ...(config.metadata || {}),
        },
      }),
    ),
  );
}

async function createOrderEventNotifications(order, eventType) {
  const orderCode = order.orderId || order._id?.toString() || "unknown-order";

  const templates = {
    created: {
      type: "order-placed",
      title: "Order placed",
      message: `Order ${orderCode} has been placed and is waiting for processing.`,
    },
    assigned: {
      type: "order-assigned",
      title: "Order assigned",
      message: `Order ${orderCode} has been assigned for delivery.`,
    },
    accepted: {
      type: "order-accepted",
      title: "Order accepted",
      message: `Order ${orderCode} has been accepted by the delivery agent.`,
    },
    shipped: {
      type: "order-shipped",
      title: "Order shipped",
      message: `Order ${orderCode} is on the move and has been shipped.`,
    },
    delivered: {
      type: "order-delivered",
      title: "Order delivered",
      message: `Order ${orderCode} has been delivered successfully.`,
    },
    completed: {
      type: "order-completed",
      title: "Order completed",
      message: `Order ${orderCode} has been completed and closed.`,
    },
    cancelled: {
      type: "order-cancelled",
      title: "Order cancelled",
      message: `Order ${orderCode} has been cancelled.`,
    },
  };

  const template = templates[eventType];
  if (!template) {
    return [];
  }

  const recipientOptions = {
    includeAgent: eventType === "assigned" || eventType === "accepted" || eventType === "cancelled",
  };

  if (eventType === "assigned" || eventType === "accepted") {
    return createNotificationForRecipients(
      { ...order, customerId: null },
      template,
      recipientOptions,
    );
  }

  return createNotificationForRecipients(order, template, recipientOptions);
}

module.exports = {
  createRoleNotification,
  createNotificationForRecipients,
  createOrderEventNotifications,
};