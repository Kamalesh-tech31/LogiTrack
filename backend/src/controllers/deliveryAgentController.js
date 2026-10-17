const DeliveryAgent = require("../models/DeliveryAgent");
const User = require("../models/User");
const { createRoleNotification } = require("../services/notificationService");

const getAllDeliveryAgents = async (req, res, next) => {
  try {
    const userAgents = await User.find({ role: "Delivery Agent" }).lean();
    const formattedUserAgents = userAgents.map((user) => ({
      _id: user._id,
      name: user.fullName,
      contact: user.email || user.phone || "",
      isAvailable: true,
      vehicle: "",
    }));

    res.json({
      success: true,
      count: formattedUserAgents.length,
      data: formattedUserAgents,
    });
  } catch (error) {
    next(error);
  }
};

const getDeliveryAgentById = async (req, res, next) => {
  try {
    const agent = await DeliveryAgent.findById(req.params.id).lean();
    if (!agent) {
      return res
        .status(404)
        .json({ success: false, message: "Agent not found" });
    }
    res.json({ success: true, data: agent });
  } catch (error) {
    next(error);
  }
};

const createDeliveryAgent = async (req, res, next) => {
  try {
    const { name, contact, vehicle, isAvailable = true } = req.body;

    if (!name || !contact) {
      return res.status(400).json({
        success: false,
        message: "Agent name and contact are required.",
      });
    }

    const agent = await DeliveryAgent.create({
      name: name.trim(),
      contact: contact.trim(),
      vehicle: vehicle?.trim?.() || "",
      isAvailable: Boolean(isAvailable),
    });

    if (req.user?.role === "Business Owner") {
      await createRoleNotification({
        recipient: req.user.id,
        recipientRole: "Business Owner",
        type: "delivery-agent-added",
        title: "New delivery agent added",
        message: `${agent.name} was added to your delivery team.`,
        metadata: {
          contact: agent.contact,
          vehicle: agent.vehicle,
        },
      });
    }

    res.status(201).json({ success: true, data: agent });
  } catch (error) {
    next(error);
  }
};

const updateDeliveryAgent = async (req, res, next) => {
  try {
    const agent = await DeliveryAgent.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      },
    );

    if (!agent) {
      return res
        .status(404)
        .json({ success: false, message: "Agent not found" });
    }

    res.json({ success: true, data: agent });
  } catch (error) {
    next(error);
  }
};

const deleteDeliveryAgent = async (req, res, next) => {
  try {
    const agent = await DeliveryAgent.findByIdAndDelete(req.params.id);
    if (!agent) {
      return res
        .status(404)
        .json({ success: false, message: "Agent not found" });
    }
    res.json({ success: true, data: agent });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllDeliveryAgents,
  getDeliveryAgentById,
  createDeliveryAgent,
  updateDeliveryAgent,
  deleteDeliveryAgent,
};
