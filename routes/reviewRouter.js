const express = require("express");
const router = express.Router();

const reviewController = require("../controllers/reviewController");

// Add Review
router.post("/:homeId", reviewController.postReview);

module.exports = router;