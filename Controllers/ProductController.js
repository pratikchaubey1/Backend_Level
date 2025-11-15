const bcrypt = require('bcrypt');
const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');
const seedProducts = require('../data/products');

// Simple lightweight URL check
const isValidUrl = (s) => {
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

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

    // Ensure categories exist and build a map name -> id (case-insensitive)
    const categoryNames = [...new Set(seedProducts.map((p) => (p.category || '').trim()).filter(Boolean))];
    const categoriesMap = {};

    for (const name of categoryNames) {
      const normalized = name.toLowerCase();
      let cat = await Category.findOne({ Name: new RegExp(`^${name}$`, 'i') }); // case-insensitive search
      if (!cat) {
        cat = await Category.create({ Name: name });
      }
      categoriesMap[normalized] = cat._id;
    }

    // Create products
    const docs = seedProducts.map((p) => {
      const catKey = (p.category || '').trim().toLowerCase();
      return {
        Name: (p.Name || '').trim(),
        Description: (p.Description || '').trim(),
        Price: Number(p.Price) || 0,
        ProductImage: p.Img ? [p.Img] : [],
        Category: categoriesMap[catKey] || null,
        User: systemUser._id,
        Stock: 0,
      };
    });

    await Product.insertMany(docs);
    console.log('Seeded initial products from seedProducts.');
  } catch (error) {
    console.error('Error seeding products:', error);
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
    console.error('getAllProducts error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/products - create a new product from admin panel
// Expects body: { Name, Description, Price, Img, category }
const createProduct = async (req, res) => {
  try {
    // trim and normalize inputs
    const Name = req.body.Name ? String(req.body.Name).trim() : '';
    const Description = req.body.Description ? String(req.body.Description).trim() : '';
    const Price = req.body.Price;
    const Img = req.body.Img ? String(req.body.Img).trim() : '';
    const category = req.body.category ? String(req.body.category).trim() : '';

    if (!Name || !Description || Price === undefined || Price === null || !Img || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name, Description, Price, Img and category are required',
      });
    }

    const priceNumber = Number(Price);
    if (!Number.isFinite(priceNumber)) {
      return res.status(400).json({ success: false, message: 'Price must be a number' });
    }
    if (priceNumber < 0) {
      return res.status(400).json({ success: false, message: 'Price must be zero or a positive number' });
    }

    if (!isValidUrl(Img)) {
      return res.status(400).json({ success: false, message: 'Img must be a valid URL (http(s)://...)' });
    }

    // Ensure category exists (case-insensitive lookup)
    let cat = await Category.findOne({ Name: new RegExp(`^${category}$`, 'i') });
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
    console.error('createProduct error:', error);
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
    console.error('deleteProduct error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  seedInitialProducts,
  getAllProducts,
  createProduct,
  deleteProduct,
};
