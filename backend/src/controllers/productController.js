const fs = require("fs");
const Product = require("../models/product");
const InventoryHistory = require("../models/InventoryHistory");
const uploadToCloudinary = require("../utils/uploadToCloudinary");
const { createRoleNotification } = require("../services/notificationService");

const DEFAULT_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1580894908361-967195033215";

function isLowStock(product) {
  return (
    typeof product.stock === "number" &&
    typeof product.minStock === "number" &&
    product.stock < product.minStock
  );
}

function generateSkuString(name = "PRD") {
  const cleanPrefix =
    name.trim().replace(/[^a-zA-Z0-9]/g, "").slice(0, 3).toUpperCase() || "PRD";
  const chars = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let randomPart = "";
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${cleanPrefix}-${randomPart}`;
}

// Generate a unique SKU for a business owner
exports.generateSku = async (req, res, next) => {
  try {
    const { name, prefix } = req.query;
    let basePrefix =
      prefix ||
      (name ? name.trim().replace(/[^a-zA-Z0-9]/g, "").slice(0, 3).toUpperCase() : "PRD");
    if (!basePrefix) basePrefix = "PRD";

    let generated = "";
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      generated = generateSkuString(basePrefix);
      const existing = await Product.findOne({
        ownerId: req.user.id,
        sku: generated,
        isActive: true,
      });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    res.json({ success: true, sku: generated });
  } catch (err) {
    next(err);
  }
};

// Upload a product image from file or URL to Cloudinary
exports.uploadProductImage = async (req, res, next) => {
  try {
    if (req.file) {
      const allowedMimes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/svg+xml",
      ];
      if (!allowedMimes.includes(req.file.mimetype)) {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: "Invalid file type. Supported formats: JPEG, PNG, WEBP, GIF, SVG.",
        });
      }

      if (req.file.size > 10 * 1024 * 1024) {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: "File size exceeds 10MB limit.",
        });
      }

      const secureUrl = await uploadToCloudinary(
        req.file.path,
        "logitrack/products"
      );
      return res.json({ success: true, url: secureUrl });
    }

    const { imageUrl } = req.body;
    if (
      imageUrl &&
      (imageUrl.startsWith("http://") || imageUrl.startsWith("https://"))
    ) {
      // If already a Cloudinary asset, reuse directly
      if (imageUrl.includes("res.cloudinary.com")) {
        return res.json({ success: true, url: imageUrl });
      }

      const secureUrl = await uploadToCloudinary(
        imageUrl,
        "logitrack/products"
      );
      return res.json({ success: true, url: secureUrl });
    }

    return res.status(400).json({
      success: false,
      message: "Please upload an image file or provide a valid image URL",
    });
  } catch (err) {
    next(err);
  }
};

// Create a new product
exports.createProduct = async (req, res, next) => {
  try {
    let {
      name,
      description,
      price,
      images,
      image,
      imageUrl,
      category,
      sku,
      tags,
      stock,
      minStock,
    } = req.body;

    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Product name is required" });
    }

    if (price == null || isNaN(Number(price)) || Number(price) < 0) {
      return res
        .status(400)
        .json({ success: false, message: "Valid positive price is required" });
    }

    // 1. Process Product Images (File or URL via Cloudinary)
    let finalImages = [];

    if (req.file) {
      // Local file uploaded directly via multipart
      const secureUrl = await uploadToCloudinary(
        req.file.path,
        "logitrack/products"
      );
      finalImages.push(secureUrl);
    } else {
      const rawImage =
        imageUrl ||
        image ||
        (Array.isArray(images) && images.length ? images[0] : null);

      if (rawImage && typeof rawImage === "string" && rawImage.trim()) {
        const trimmedUrl = rawImage.trim();
        if (
          trimmedUrl.startsWith("http://") ||
          trimmedUrl.startsWith("https://")
        ) {
          if (trimmedUrl.includes("res.cloudinary.com")) {
            finalImages.push(trimmedUrl);
          } else {
            try {
              // Upload external URL to Cloudinary
              const secureUrl = await uploadToCloudinary(
                trimmedUrl,
                "logitrack/products"
              );
              finalImages.push(secureUrl);
            } catch (uploadErr) {
              console.warn(
                "Cloudinary import from URL failed, using URL fallback:",
                uploadErr.message
              );
              finalImages.push(trimmedUrl);
            }
          }
        } else {
          finalImages.push(trimmedUrl);
        }
      } else {
        finalImages.push(DEFAULT_PRODUCT_IMAGE);
      }
    }

    // 2. Process and Validate SKU
    let finalSku = sku ? sku.trim() : "";
    if (finalSku) {
      const existingSku = await Product.findOne({
        ownerId: req.user.id,
        sku: finalSku,
        isActive: true,
      });

      if (existingSku) {
        return res.status(400).json({
          success: false,
          message: `SKU '${finalSku}' already exists in your inventory. Please choose a unique SKU.`,
        });
      }
    } else {
      // Auto-generate a unique SKU
      let attempts = 0;
      let isUnique = false;
      while (!isUnique && attempts < 10) {
        finalSku = generateSkuString(name);
        const existing = await Product.findOne({
          ownerId: req.user.id,
          sku: finalSku,
          isActive: true,
        });
        if (!existing) {
          isUnique = true;
        }
        attempts++;
      }
    }

    const product = new Product({
      name: name.trim(),
      description: description ? description.trim() : "",
      price: Number(price),
      images: finalImages,
      category: category || "general",
      sku: finalSku,
      tags: Array.isArray(tags) ? tags : [],
      stock: Number(stock) || 0,
      minStock: minStock != null ? Number(minStock) : 5,
      ownerId: req.user.id,
    });

    await product.save();

    await InventoryHistory.create({
      ownerId: req.user.id,
      productId: product._id,
      productName: product.name,
      action: `Created product ${product.name}`,
      quantity: product.stock || 0,
      details: "New product added to inventory",
    });

    await createRoleNotification({
      recipient: req.user.id,
      recipientRole: "Business Owner",
      type: "product-added",
      title: "Product added",
      message: `${product.name} was added to your catalog with SKU ${finalSku}.`,
      orderId: null,
      orderCode: null,
      metadata: {
        status: isLowStock(product) ? "low-stock" : "active",
        sku: finalSku,
      },
    });

    if (isLowStock(product)) {
      await createRoleNotification({
        recipient: req.user.id,
        recipientRole: "Business Owner",
        type: "product-stock-low",
        title: "Product stock low",
        message: `${product.name} is below the minimum stock threshold.`,
        metadata: {
          stock: product.stock,
          minStock: product.minStock,
        },
      });
    }

    res.status(201).json({ success: true, data: product });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate product attribute detected. Please check SKU.",
      });
    }
    next(err);
  }
};

// Get list of products with optional query filters
exports.getProducts = async (req, res, next) => {
  try {
    const { q, category, minPrice, maxPrice, inStock } = req.query;
    const filter = {};

    if (q)
      filter.$or = [
        { name: new RegExp(q, "i") },
        { description: new RegExp(q, "i") },
      ];
    if (category) filter.category = category;
    if (minPrice)
      filter.price = { ...(filter.price || {}), $gte: Number(minPrice) };
    if (maxPrice)
      filter.price = { ...(filter.price || {}), $lte: Number(maxPrice) };
    if (inStock === "true") filter.stock = { $gt: 0 };

    const products = await Product.find({
      ...filter,
      ownerId: req.user.id,
      isActive: true,
    }).sort({ createdAt: -1 });
    res.json({ success: true, count: products.length, data: products });
  } catch (err) {
    next(err);
  }
};

// Get single product by id
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      ownerId: req.user.id,
    });
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

// Update product
exports.updateProduct = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    // Prevent setting negative stock
    if (updates.stock != null && Number(updates.stock) < 0) {
      return res
        .status(400)
        .json({ success: false, message: "Stock cannot be negative" });
    }

    const original = await Product.findOne({
      _id: req.params.id,
      ownerId: req.user.id,
    });
    if (!original)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    // Handle SKU uniqueness if updating SKU
    if (updates.sku && updates.sku.trim() !== original.sku) {
      const trimmedSku = updates.sku.trim();
      const existingSku = await Product.findOne({
        _id: { $ne: req.params.id },
        ownerId: req.user.id,
        sku: trimmedSku,
        isActive: true,
      });
      if (existingSku) {
        return res.status(400).json({
          success: false,
          message: `SKU '${trimmedSku}' already exists in your inventory. Please choose a unique SKU.`,
        });
      }
      updates.sku = trimmedSku;
    }

    // Handle file upload or image URL
    if (req.file) {
      const secureUrl = await uploadToCloudinary(
        req.file.path,
        "logitrack/products"
      );
      updates.images = [secureUrl];
    } else if (updates.imageUrl || updates.image) {
      const rawImage = (updates.imageUrl || updates.image).trim();
      if (rawImage.startsWith("http://") || rawImage.startsWith("https://")) {
        if (rawImage.includes("res.cloudinary.com")) {
          updates.images = [rawImage];
        } else {
          try {
            const secureUrl = await uploadToCloudinary(
              rawImage,
              "logitrack/products"
            );
            updates.images = [secureUrl];
          } catch (err) {
            console.warn("Cloudinary URL import error on update:", err.message);
            updates.images = [rawImage];
          }
        }
      }
    }

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.id },
      updates,
      { new: true, runValidators: true },
    );
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    if (typeof updates.stock === "number" && updates.stock !== original.stock) {
      await InventoryHistory.create({
        ownerId: req.user.id,
        productId: product._id,
        productName: product.name,
        action: `Updated stock of ${product.name}`,
        quantity: updates.stock - original.stock,
        details: `Stock changed from ${original.stock} to ${updates.stock}`,
      });
    }

    const originalLowStock = isLowStock(original);
    const updatedLowStock = isLowStock(product);

    if (updates.name && updates.name !== original.name) {
      await InventoryHistory.create({
        ownerId: req.user.id,
        productId: product._id,
        productName: product.name,
        action: `Renamed product from ${original.name} to ${product.name}`,
        quantity: 0,
        details: "Product metadata updated",
      });
    }

    if (Object.keys(updates).length > 0) {
      await createRoleNotification({
        recipient: req.user.id,
        recipientRole: "Business Owner",
        type: "product-updated",
        title: "Product updated",
        message: `${product.name} was updated successfully.`,
        metadata: {
          updatedFields: Object.keys(updates),
        },
      });
    }

    if (!originalLowStock && updatedLowStock) {
      await createRoleNotification({
        recipient: req.user.id,
        recipientRole: "Business Owner",
        type: "product-stock-low",
        title: "Product stock low",
        message: `${product.name} is below the minimum stock threshold.`,
        metadata: {
          stock: product.stock,
          minStock: product.minStock,
        },
      });
    }

    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

// Delete product (soft-delete)
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      ownerId: req.user.id,
    });
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    // soft delete to preserve history
    product.isActive = false;
    await product.save();

    await InventoryHistory.create({
      ownerId: req.user.id,
      productId: product._id,
      productName: product.name,
      action: `Deleted product ${product.name}`,
      quantity: 0,
      details: "Product removed from inventory",
    });

    res.json({ success: true, message: "Product removed" });
  } catch (err) {
    next(err);
  }
};
