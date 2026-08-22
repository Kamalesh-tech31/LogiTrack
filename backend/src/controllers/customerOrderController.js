const Order = require("../models/Order");
const orderController = require("./orderController");

exports.createOrder = async (req, res, next) => {
  try {
    if (!req.body.userId && req.user) {
      req.body.userId = req.user.id || req.user._id;
    }
    return orderController.createOrder(req, res, next);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
    });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const customerId = req.user?.id || req.user?._id;
    if (!customerId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const search = (req.query.search || "").toString().trim().toLowerCase();

    // Fetch from Order collection only orders belonging to authenticated customer
    const filter = { customerId };
    let orders = await Order.find(filter)
      .populate("items.product")
      .sort({ createdAt: -1 });

    if (search) {
      orders = orders.filter((order) => {
        const matchCustomer = (order.customerName || "")
          .toLowerCase()
          .includes(search);
        const items = order.items || [];
        const matchItem = items.some((it) => {
          const name =
            (it.product && (it.product.name || it.product.title)) || "";
          return name.toLowerCase().includes(search);
        });
        return matchCustomer || matchItem;
      });
    }

    const mappedOrders = orders.map((order) => ({
      id: order._id.toString(),
      orderId: order.orderId,
      customer: order.customerName,
      amount: order.totalPrice,
      status: order.status === "completed" ? "delivered" : order.status,
      date: order.createdAt,
      items: (order.items || []).map((it) => ({
        product: (it.product && (it.product.name || it.product.title)) || null,
        quantity: it.quantity,
        price: it.price,
      })),
    }));

    res.status(200).json({ success: true, data: mappedOrders });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const customerId = req.user?.id || req.user?._id;
    if (!customerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      customerId,
    }).populate("items.product");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json(order);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch order", error: error.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const customerId = req.user?.id || req.user?._id;
    if (!customerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: req.params.id,
        customerId,
      },
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json(updatedOrder);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update order", error: error.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const customerId = req.user?.id || req.user?._id;
    if (!customerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const deletedOrder = await Order.findOneAndDelete({
      _id: req.params.id,
      customerId,
    });
    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete order", error: error.message });
  }
};
