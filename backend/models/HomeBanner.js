const mongoose = require("mongoose");

const homeBannerSchema = new mongoose.Schema(
  {
    smallText: {
      type: String,
      default: "Welcome to Sri Lakshmi Durga Agencies",
    },
    title: {
      type: String,
      default: "Elegant Ladies Clothing & Essentials",
    },
    description: {
      type: String,
      default:
        "Shop beautiful kurtis, dresses, tops, essentials and accessories at affordable prices.",
    },
    offerText: {
      type: String,
      default: "Up to 40% OFF",
    },
    image: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HomeBanner", homeBannerSchema);