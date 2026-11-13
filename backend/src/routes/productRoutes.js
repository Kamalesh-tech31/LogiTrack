const authenticateToken = require("../middleware/authenticateToken");
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { productImageUpload } = require('../config/multer');
const {
  PRODUCT_IMAGE_FIELD_ALLOWED_TYPES,
  validateUploadedFiles,
} = require('../middleware/validateUpload');
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
router.post('/upload-image', productImageUpload.single('image'), validateUploadedFiles(PRODUCT_IMAGE_FIELD_ALLOWED_TYPES), productController.uploadProductImage);
router.post('/', productImageUpload.single('image'), validateUploadedFiles(PRODUCT_IMAGE_FIELD_ALLOWED_TYPES), productController.createProduct);
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);
router.put('/:id', productImageUpload.single('image'), validateUploadedFiles(PRODUCT_IMAGE_FIELD_ALLOWED_TYPES), productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
