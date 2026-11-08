const authenticateToken = require("../middleware/authenticateToken");
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const upload = require('../config/multer');
const { isBusinessOwner } = require('../services/deliveryOtpService');

router.use(authenticateToken);

// Only Business Owners may access product management routes
router.use((req, res, next) => {
  if (!isBusinessOwner(req.user)) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }
  next();
});

router.get('/generate-sku', productController.generateSku);
router.post('/upload-image', upload.single('image'), productController.uploadProductImage);
router.post('/', upload.single('image'), productController.createProduct);
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);
router.put('/:id', upload.single('image'), productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
