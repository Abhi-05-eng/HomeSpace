const crypto = require("crypto");
const Booking = require("../models/booking");
const Home = require("../models/home");
const razorpay = require("../utils/razorpay");
const sendMail = require("../utils/sendMail");
const User = require("../models/user");
const generateInvoice = require("../utils/generateInvoice");
const path = require("path");

exports.createOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    const options = {
      amount: amount * 100, // Razorpay expects paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    console.log("KEY ID:", process.env.RAZORPAY_KEY_ID);
    console.log("SECRET PRESENT:", !!process.env.RAZORPAY_KEY_SECRET);
    console.log("OPTIONS:", options);

    const order = await razorpay.orders.create(options);

    return res.status(200).json({
      success: true,
      order,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("========== RAZORPAY ERROR ==========");
    console.error(err);
    console.error("====================================");

    return res.status(500).json({
      success: false,
      message: err.message,
      error: err.error || null,
    });
  }
};

exports.verifyPayment = async (req, res) => {
  console.log("========== VERIFY PAYMENT START ==========");
  console.log(req.body);

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,

      homeId,
      checkIn,
      checkOut,
      guests,
    } = req.body;

    // Verify Signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment Verification Failed",
      });
    }

    const home = await Home.findById(homeId);

    const guestId = req.session.user._id;

    const oneDay = 1000 * 60 * 60 * 24;

    const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / oneDay);

    const totalPrice = nights * home.price;

    const alreadyBooked = await Booking.findOne({
      homeId,

      status: {
        $in: ["Pending", "Confirmed"],
      },

      checkIn: {
        $lt: new Date(checkOut),
      },

      checkOut: {
        $gt: new Date(checkIn),
      },
    });

    if (alreadyBooked) {
      return res.status(400).json({
        success: false,
        message: "This home is already booked for the selected dates.",
      });
    }

    const booking = new Booking({
      homeId,
      guestId,

      hostId: home.userId,

      checkIn,
      checkOut,
      guests,

      nights,
      totalPrice,

      paymentId: razorpay_payment_id,

      orderId: razorpay_order_id,

      paymentStatus: "Paid",
    });
await booking.save();

console.log("Booking Saved");

// Fetch Guest Details
const guest = await User.findById(guestId);

// Generate PDF Invoice
const invoicePath = generateInvoice(
    booking,
    home,
    guest
);
booking.invoiceFile = path.basename(invoicePath);
await booking.save();

console.log("Invoice Generated:", invoicePath);

    // Send Confirmation Email
    await sendMail(
      guest.email,

      "🎉 HomeSpace Booking Confirmed",

      `
    <div style="font-family:Arial,sans-serif;padding:20px">

        <h2 style="color:#10b981;">
            Booking Confirmed 🎉
        </h2>

        <p>Hello <b>${guest.firstName}</b>,</p>

        <p>Your booking has been confirmed successfully.</p>

        <hr>

        <h3>Booking Details</h3>

        <p><b>🏡 Home:</b> ${home.houseName}</p>

        <p><b>📍 Location:</b> ${home.location}</p>

        <p><b>📅 Check In:</b> ${new Date(checkIn).toLocaleDateString("en-IN")}</p>

        <p><b>📅 Check Out:</b> ${new Date(checkOut).toLocaleDateString("en-IN")}</p>

        <p><b>👥 Guests:</b> ${guests}</p>

        <p><b>🌙 Nights:</b> ${nights}</p>

        <p><b>💰 Total Paid:</b> ₹${totalPrice}</p>

        <p><b>💳 Payment Status:</b> Paid ✅</p>

        <br>

        <p>
            Thank you for choosing
            <b>HomeSpace</b>.
        </p>

    </div>
    `,
    );

    res.json({
      success: true,
    });
  } catch (err) {
    console.log("VERIFY PAYMENT ERROR");

    console.log(err);

    res.status(500).json({
      success: false,
    });
  }
};
