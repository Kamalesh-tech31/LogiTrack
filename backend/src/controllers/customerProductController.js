const Product = require("../models/product");

exports.getAllProducts = async (req, res) => {
  try {
    // Only return products that are active and have stock > 0 for customers
    const products = await Product.find({
      isActive: true,
      stock: { $gt: 0 },
    }).sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch products", error: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(product);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch product", error: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      image,
      price,
      stock,
      rating,
      featured,
      deliveryTime,
    } = req.body;

    const newProduct = new CustomerProduct({
      name,
      description,
      category,
      image,
      price,
      stock,
      rating,
      featured,
      deliveryTime,
    });

    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create product", error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const updatedProduct = await CustomerProduct.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(updatedProduct);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update product", error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await CustomerProduct.findByIdAndDelete(
      req.params.id,
    );
    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete product", error: error.message });
  }
};
