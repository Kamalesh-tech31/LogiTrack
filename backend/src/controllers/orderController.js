const Order = require("../models/Order");
const Product = require("../models/product");
const User = require("../models/User");
const { createOrderEventNotifications } = require("../services/notificationService");
const { geocodeAddress, getAddressSuggestions } = require("../services/geocodingService");
const fs = require("fs");
const path = require("path");

// File logging for debugging
const logToFile = (message) => {
  const logPath = path.join(__dirname, "../../order-debug.log");
  const timestamp = new Date().toISOString();
  try {
    fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
  } catch {}
};

// Helper to generate orderId
const generateOrderId = () =>
  `ORD-${Date.now()}-${Math.floor(Math.random() * 9000) + 1000}`;

// Create order with automatic delivery creation
exports.createOrder = async (req, res, next) => {
  try {
    const { userId, items, deliveryAddress } = req.body;

    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "userId and items are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Validate products and calculate total with atomic stock deduction & rollback safety
    let total = 0;
    const orderItems = [];
    let ownerId = null;

    for (const it of items) {
      const { productId, quantity } = it;

      if (!productId || !quantity || quantity < 1) {
        for (const rolledItem of orderItems) {
          await Product.findByIdAndUpdate(rolledItem.product, {
            $inc: { stock: rolledItem.quantity },
          });
        }
        return res
          .status(400)
          .json({ success: false, message: "Invalid item or quantity in order" });
      }

      // Atomic stock check & deduction (prevents race condition overselling)
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: productId, stock: { $gte: quantity }, isActive: true },
        { $inc: { stock: -quantity } },
        { new: true },
      );

      if (!updatedProduct) {
        // Rollback any previously decremented items in this multi-item order
        for (const rolledItem of orderItems) {
          await Product.findByIdAndUpdate(rolledItem.product, {
            $inc: { stock: rolledItem.quantity },
          });
        }

        const existingProd = await Product.findById(productId);
        if (!existingProd) {
          return res
            .status(404)
            .json({ success: false, message: "Product not found" });
        }

        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${existingProd.name}". Available: ${existingProd.stock}, requested: ${quantity}`,
        });
      }

      if (!ownerId) ownerId = updatedProduct.ownerId;

      const price = updatedProduct.price;
      total += price * quantity;
      orderItems.push({ product: updatedProduct._id, quantity, price });
    }

    // Process & enrich delivery address with fullAddress and geocoding if needed
    let processedAddress = { ...(deliveryAddress || {}) };
    const fullAddressStr =
      processedAddress.fullAddress ||
      [
        processedAddress.doorNo,
        processedAddress.street,
        processedAddress.area,
        processedAddress.city,
        processedAddress.state,
        processedAddress.postalCode,
      ]
        .filter(Boolean)
        .join(", ") ||
      processedAddress.street ||
      "";

    if (
      fullAddressStr &&
      (!processedAddress.latitude || !processedAddress.longitude)
    ) {
      try {
        const geo = await geocodeAddress(fullAddressStr);
        if (geo?.success && geo?.data) {
          processedAddress.latitude = geo.data.latitude;
          processedAddress.longitude = geo.data.longitude;
          if (!processedAddress.city && geo.data.city)
            processedAddress.city = geo.data.city;
          if (!processedAddress.state && geo.data.state)
            processedAddress.state = geo.data.state;
          if (!processedAddress.postalCode && geo.data.postalCode)
            processedAddress.postalCode = geo.data.postalCode;
        }
      } catch (geoErr) {
        console.warn(
          "[Geocoding on createOrder] Geo lookup warning:",
          geoErr.message,
        );
      }
    }

    processedAddress.fullAddress = fullAddressStr;
    if (!processedAddress.fullName && user.fullName) {
      processedAddress.fullName = user.fullName;
    }
    if (!processedAddress.phone && (user.phone || user.phoneNumber)) {
      processedAddress.phone = user.phone || user.phoneNumber;
    }

    // Snapshot Business Owner verified warehouse/shop location as pickupAddress
    let pickupAddress = null;
    if (ownerId) {
      const ownerUser = await User.findById(ownerId);
      if (
        ownerUser?.warehouseAddress &&
        (ownerUser.warehouseAddress.latitude != null ||
          ownerUser.warehouseAddress.fullAddress)
      ) {
        pickupAddress = {
          doorNo: ownerUser.warehouseAddress.doorNo || "",
          street: ownerUser.warehouseAddress.street || "",
          area: ownerUser.warehouseAddress.area || "",
          fullAddress:
            ownerUser.warehouseAddress.fullAddress ||
            ownerUser.businessAddress ||
            "Merchant Warehouse",
          fullName:
            ownerUser.warehouseAddress.businessName ||
            ownerUser.businessName ||
            ownerUser.fullName,
          phone: ownerUser.phone || "",
          city: ownerUser.warehouseAddress.city || "",
          state: ownerUser.warehouseAddress.state || "",
          postalCode: ownerUser.warehouseAddress.postalCode || "",
          country: ownerUser.warehouseAddress.country || "India",
          latitude: ownerUser.warehouseAddress.latitude || null,
          longitude: ownerUser.warehouseAddress.longitude || null,
        };
      } else if (ownerUser?.businessAddress) {
        pickupAddress = {
          fullAddress: ownerUser.businessAddress,
          fullName: ownerUser.businessName || ownerUser.fullName,
          phone: ownerUser.phone || "",
          city: "Chennai",
          country: "India",
        };
      }
    }

    // Optional: Save this address as customer's default/home address only if explicitly requested
    if (req.body.saveAsDefaultAddress || req.body.saveAsHome) {
      user.defaultAddress = {
        label: req.body.addressLabel || "Home",
        doorNo: processedAddress.doorNo || "",
        street: processedAddress.street || "",
        area: processedAddress.area || "",
        fullAddress: processedAddress.fullAddress || "",
        city: processedAddress.city || "",
        state: processedAddress.state || "",
        postalCode: processedAddress.postalCode || "",
        country: processedAddress.country || "India",
        latitude: processedAddress.latitude || null,
        longitude: processedAddress.longitude || null,
      };
      await user.save();
    }

    const orderId = generateOrderId();
    const order = new Order({
      orderId,
      customerId: userId,
      ownerId,
      customerName: user.fullName,
      items: orderItems,
      totalPrice: total,
      pickupAddress: pickupAddress || undefined,
      deliveryAddress: processedAddress,
      status: "pending",
    });

    const savedOrder = await order.save();
    await createOrderEventNotifications(savedOrder, "created");

    res.status(201).json({ success: true, data: savedOrder });
  } catch (err) {
    logToFile(`ORDER CREATION ERROR: ${err.message}`);
    next(err);
  }
};

// Get all orders scoped to authenticated user relationship
exports.getOrders = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const role = req.user?.role;
    const filter = {};

    if (role === "Customer") {
      filter.customerId = userId;
    } else if (role === "Business Owner" || role === "Owner") {
      filter.ownerId = userId;
    } else if (role === "Delivery Agent") {
      filter.$or = [
        { assignedAgent: userId },
        { assignedAgent: { $exists: false } },
        { assignedAgent: null },
      ];
    } else {
      filter.$or = [
        { customerId: userId },
        { ownerId: userId },
        { assignedAgent: userId },
      ];
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate("items.product", "name price images")
      .populate("customerId", "fullName email phone phoneNumber");

    res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (err) {
    next(err);
  }
};

// Get business owner orders (for their products)
exports.getBusinessOrders = async (req, res, next) => {
  try {
    const ownerId = req.user?.id || req.user?._id;
    if (!ownerId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const orders = await Order.find({ ownerId })
      .sort({ createdAt: -1 })
      .populate("items.product", "name price images ownerId")
      .populate("customerId", "fullName email phone phoneNumber");

    res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (err) {
    next(err);
  }
};

// Get customer's orders
exports.getCustomerOrders = async (req, res, next) => {
  try {
    const customerId = req.user?.id || req.user?._id;
    if (!customerId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const orders = await Order.find({ customerId })
      .sort({ createdAt: -1 })
      .populate("items.product", "name price images");

    res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (err) {
    next(err);
  }
};

// Get order by id with relationship authorization
exports.getOrderById = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const order = await Order.findById(req.params.id)
      .populate("items.product", "name price images")
      .populate("customerId", "fullName email phone phoneNumber");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const role = req.user?.role;
    const orderCustomerId = order.customerId?._id
      ? String(order.customerId._id)
      : String(order.customerId || "");
    const orderOwnerId = order.ownerId?._id
      ? String(order.ownerId._id)
      : String(order.ownerId || "");
    const orderAssignedAgent = order.assignedAgent?._id
      ? String(order.assignedAgent._id)
      : String(order.assignedAgent || "");

    const isCustomer = orderCustomerId && orderCustomerId === String(userId);
    const isOwner = orderOwnerId && orderOwnerId === String(userId);
    const isAssignedAgent =
      orderAssignedAgent && orderAssignedAgent === String(userId);
    const isClaimableAgent =
      !order.assignedAgent && role === "Delivery Agent";

    if (!isCustomer && !isOwner && !isAssignedAgent && !isClaimableAgent) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

// Update order status
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    order.status = status;
    if (status === "shipped") order.shippedAt = new Date();
    if (status === "delivered" || status === "completed")
      order.deliveredAt = new Date();
    await order.save();

    await createOrderEventNotifications(order, status);

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

// Delete/Cancel order
exports.deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    // If order not delivered, return stock
    if (order.status !== "delivered") {
      await createOrderEventNotifications(order, "cancelled");
      for (const it of order.items) {
        await Product.findByIdAndUpdate(it.product, {
          $inc: { stock: it.quantity },
        });
      }
    }

    await Order.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Order deleted and stock restored" });
  } catch (err) {
    next(err);
  }
};

// Geocode address using Geoapify
exports.geocodeAddressController = async (req, res, next) => {
  try {
    const address = req.body?.address || req.query?.address;
    if (!address || typeof address !== "string" || address.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Delivery address is required for geocoding.",
      });
    }

    const result = await geocodeAddress(address);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }
    return res.status(200).json({
      success: true,
      source: result.source,
      data: result.data,
    });
  } catch (err) {
    console.error("Geocoding controller error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to geocode the provided address. Please try again.",
      error: err.message,
    });
  }
};

// Address suggestions / autocomplete endpoint
exports.getAddressSuggestionsController = async (req, res, next) => {
  try {
    const query =
      req.query?.query ||
      req.body?.query ||
      req.query?.text ||
      req.body?.text;
    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const suggestions = await getAddressSuggestions(query.trim());
    return res.status(200).json({
      success: true,
      data: suggestions,
    });
  } catch (err) {
    console.error("Address suggestions error:", err);
    return res.status(200).json({
      success: true,
      data: [],
    });
  }
};
