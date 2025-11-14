const mongoose = require("mongoose");
const category = require("./Category");

//   Name:
//   Price:
//   Img:
//   category:
//   Description:

const ProductSchema = new mongoose.Schema({
  Name: {
    type: String,
    required: true,
  },
  Description: {
    type: String,
    required: true,
  },
  ProductImage: {
    type: [String], // array of image URL strings
    required: true,
  },
  Price: {
    type: Number,
    required: true,
  },
  Category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "category",
    required: true,
  },
  User: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  Stock:{
    type: Number,
    required: true,
    default:0, 
  }
});

const Product = mongoose.model("Product", ProductSchema);
module.exports = Product;
