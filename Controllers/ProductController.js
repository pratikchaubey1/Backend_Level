const bcrypt = require('bcrypt');
const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');
const seedProducts = require('../data/products');

// Seed initial products into the database from the static seedProducts array.
// This runs once (when there are no products yet).
const seedInitialProducts = async () => {
  try {
    const count = await Product.countDocuments();
    if (count > 0) return; // Already seeded

    // Ensure a system user exists to own the seeded products
    let systemUser = await User.findOne({ email: 'system@level.local' });
    if (!systemUser) {
      const hashedPassword = await bcrypt.hash('system-password', 10);
      systemUser = await User.create({
        username: 'system',
        email: 'system@level.local',
        password: hashedPassword,
        role: 'admin',
      });
    }

    // Ensure categories exist and build a map name -> id
    const categoryNames = [...new Set(seedProducts.map((p) => p.category))];
    const categoriesMap = {};

    for (const name of categoryNames) {
      if (!name) continue;
      let cat = await Category.findOne({ Name: name });
      if (!cat) {
        cat = await Category.create({ Name: name });
      }
      categoriesMap[name] = cat._id;
    }

    // Create products
    const docs = seedProducts.map((p) => ({
      Name: p.Name,
      Description: p.Description,
      Price: Number(p.Price),
      ProductImage: [p.Img],
      Category: categoriesMap[p.category],
      User: systemUser._id,
      Stock: 0,
    }));

    await Product.insertMany(docs);
    console.log('Seeded initial products from seedProducts.');
  } catch (error) {
    console.error('Error seeding products:', error.message);
  }
};

// GET /api/products - return products in a shape that matches the frontend expectations
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('Category');
    const transformed = products.map((p) => ({
      id: p._id,
      Name: p.Name,
      Description: p.Description,
      Price: p.Price,
      Img: Array.isArray(p.ProductImage) && p.ProductImage.length > 0 ? p.ProductImage[0] : null,
      category: p.Category ? p.Category.Name : '',
    }));

    return res.status(200).json({ success: true, data: transformed });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/products - create a new product from admin panel
// Expects body: { Name, Description, Price, Img, category }
const createProduct = async (req, res) => {
  try {
    const { Name, Description, Price, Img, category } = req.body;

    if (!Name || !Description || !Price || !Img || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name, Description, Price, Img and category are required',
      });
    }

    const priceNumber = Number(Price);
    if (Number.isNaN(priceNumber)) {
      return res.status(400).json({ success: false, message: 'Price must be a number' });
    }

    // Ensure category exists
    let cat = await Category.findOne({ Name: category });
    if (!cat) {
      cat = await Category.create({ Name: category });
    }

    // Use system user as owner (same as seeding)
    let systemUser = await User.findOne({ email: 'system@level.local' });
    if (!systemUser) {
      const hashedPassword = await bcrypt.hash('system-password', 10);
      systemUser = await User.create({
        username: 'system',
        email: 'system@level.local',
        password: hashedPassword,
        role: 'admin',
      });
    }

    const created = await Product.create({
      Name,
      Description,
      Price: priceNumber,
      ProductImage: [Img],
      Category: cat._id,
      User: systemUser._id,
      Stock: 0,
    });

    const responseProduct = {
      id: created._id,
      Name: created.Name,
      Description: created.Description,
      Price: created.Price,
      Img,
      category: cat.Name,
    };

    return res.status(201).json({ success: true, data: responseProduct });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/products/:id - delete a product by id
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Product id is required' });
    }

    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  seedInitialProducts,
  getAllProducts,
  createProduct,
  deleteProduct,
};
