const express = require('express');
const { getAllProducts, createProduct, deleteProduct } = require('../Controllers/ProductController');

const router = express.Router();

// GET /api/products
router.get('/', getAllProducts);

// POST /api/products
router.post('/', createProduct);

// DELETE /api/products/:id
router.delete('/:id', deleteProduct);

module.exports = router;
