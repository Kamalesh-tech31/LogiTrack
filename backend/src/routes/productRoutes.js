const authenticateToken = require("../middleware/authenticateToken");
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const upload = require('../config/multer');

router.use(authenticateToken);

router.get('/generate-sku', productController.generateSku);
router.post('/upload-image', upload.single('image'), productController.uploadProductImage);
router.post('/', upload.single('image'), productController.createProduct);
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);
router.put('/:id', upload.single('image'), productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
