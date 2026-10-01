const dotenv = require("dotenv");
const mongoose = require("mongoose");
const Product = require("./models/Product");

dotenv.config();

const products = [
  {
    name: "Elegant Women Top",
    category: "Tops",
    price: 599,
    oldPrice: 999,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Pink", "Black", "White"],
    fabric: "Cotton",
    stock: 20,
    image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=700",
    description:
      "Stylish and comfortable women top suitable for daily wear and casual outings.",
  },
  {
    name: "Stylish Denim Jacket",
    category: "Jackets",
    price: 1299,
    oldPrice: 1999,
    sizes: ["M", "L", "XL"],
    colors: ["Blue", "Black"],
    fabric: "Denim",
    stock: 12,
    image: "https://images.unsplash.com/photo-1543076447-215ad9ba6923?w=700",
    description: "Premium denim jacket for a trendy and modern look.",
  },
  {
    name: "Traditional Kurti",
    category: "Kurtis",
    price: 799,
    oldPrice: 1199,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Yellow", "Red", "Green"],
    fabric: "Rayon",
    stock: 30,
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=700",
    description:
      "Beautiful traditional kurti perfect for daily wear, office wear and festivals.",
  },
  {
    name: "Party Wear Dress",
    category: "Dresses",
    price: 1499,
    oldPrice: 2499,
    sizes: ["S", "M", "L"],
    colors: ["Red", "Black"],
    fabric: "Georgette",
    stock: 10,
    image: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=700",
    description:
      "Elegant party wear dress for special occasions and celebrations.",
  },
  {
    name: "Women Essential Leggings",
    category: "Essentials",
    price: 399,
    oldPrice: 599,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Black", "White", "Navy"],
    fabric: "Cotton Lycra",
    stock: 40,
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=700",
    description: "Soft and stretchable leggings for daily comfort.",
  },
  {
    name: "Fashion Handbag",
    category: "Accessories",
    price: 999,
    oldPrice: 1599,
    sizes: ["Free Size"],
    colors: ["Brown", "Black", "Pink"],
    fabric: "PU Leather",
    stock: 15,
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=700",
    description: "Trendy handbag suitable for shopping, office and travel.",
  },
];

const seedProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    await Product.deleteMany();
    await Product.insertMany(products);

    console.log("Products inserted successfully");
    process.exit();
  } catch (error) {
    console.error("Seed error:", error.message);
    process.exit(1);
  }
};

seedProducts();