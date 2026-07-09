const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/paymentController");

// Create Razorpay Order
router.post("/create-order", paymentController.createOrder);

// Verify Payment (we'll implement next)
router.post("/verify", paymentController.verifyPayment);

router.get("/test", (req, res) => {
    res.sendFile(require("path").join(__dirname, "../views/test-payment.html"));
});

module.exports = router;