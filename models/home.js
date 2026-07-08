const mongoose = require("mongoose");

const homeSchema = new mongoose.Schema({
  houseName: {
    type: String,
    required: true
  },

  price: {
    type: Number,
    required: true
  },

  location: {
    type: String,
    required: true
  },

 rating: {
  type: Number,
  default: 0,
},

totalReviews: {
  type: Number,
  default: 0,
},

  photo: String,

  description: String,

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
});

module.exports = mongoose.model("Home", homeSchema);