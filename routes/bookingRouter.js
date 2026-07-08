const express = require("express");
const router = express.Router();

const bookingController = require("../controllers/bookingController");

router.get("/", bookingController.getBookings);
router.get("/host", bookingController.getHostBookings);
router.post("/:homeId", bookingController.postBookHome);

// Cancel Booking
router.patch("/:bookingId/cancel", bookingController.cancelBooking);
router.patch("/:bookingId/accept", bookingController.acceptBooking);
router.patch("/:bookingId/reject", bookingController.rejectBooking);

module.exports = router;