const Booking = require("../models/booking");
const Home = require("../models/home");

exports.postBookHome = async (req, res, next) => {
  try {
    // Step 1: Get home id from URL
    const homeId = req.params.homeId;

    // Step 2: Find the home
    const home = await Home.findById(homeId);

    // Step 3: Check if home exists
    if (!home) {
      return res.redirect("/homes");
    }

    // Step 4: Get logged in guest id
    const guestId = req.session.user._id;

    const { checkIn, checkOut, guests } = req.body;

    // Calculate nights
    const oneDay = 1000 * 60 * 60 * 24;

    const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / oneDay);

    // Invalid date check
    if (nights <= 0) {
      return res.redirect(`/homes/${homeId}`);
    }

    // Calculate total price
    const totalPrice = nights * home.price;

    // Step 5: Check duplicate booking
    // Check if these dates overlap with an existing booking
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
      req.flash("error", "This home is already booked for the selected dates.");

      return res.redirect(`/homes/${homeId}`);
    }

    // Step 6: Create booking
    const booking = new Booking({
      homeId: home._id,
      guestId,
      hostId: home.userId,

      checkIn,
      checkOut,
      guests,

      nights,
      totalPrice,
    });

    // Step 7: Save booking
    await booking.save();

    req.flash("success", "Your booking request has been sent successfully.");

    // Step 8: Redirect
    res.redirect("/bookings");
  } catch (err) {
    console.log("Booking Error:", err);
    res.redirect("/homes");
  }
};

exports.getBookings = async (req, res, next) => {
  try {
    // Step 1: Get logged-in guest's ID
    const guestId = req.session.user._id;

    // Step 2: Find only this guest's bookings
    const bookings = await Booking.find({
      guestId,
    }).populate("homeId");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    bookings.forEach((booking) => {
      if (booking.status === "Cancelled" || booking.status === "Rejected") {
        booking.timelineStatus = booking.status;
        return;
      }

      const checkIn = new Date(booking.checkIn);
      const checkOut = new Date(booking.checkOut);

      checkIn.setHours(0, 0, 0, 0);
      checkOut.setHours(0, 0, 0, 0);

      if (today < checkIn) {
        const daysLeft = Math.ceil((checkIn - today) / (1000 * 60 * 60 * 24));

        booking.timelineStatus = `Starts in ${daysLeft} day${daysLeft > 1 ? "s" : ""}`;
      } else if (today >= checkIn && today < checkOut) {
        booking.timelineStatus = "Currently Staying";
      } else {
        booking.timelineStatus = "Completed";
      }
    });

    // Step 3: Render bookings page
    res.render("store/bookings", {
      bookings,
      pageTitle: "My Bookings",
      currentPage: "bookings",
    });
  } catch (err) {
    console.log("Error fetching bookings:", err);
    res.redirect("/homes");
  }
};

exports.cancelBooking = async (req, res, next) => {
  try {
    const bookingId = req.params.bookingId;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.redirect("/bookings");
    }

    // Authorization Check
    if (booking.guestId.toString() !== req.session.user._id) {
      return res.redirect("/");
    }

    booking.status = "Cancelled";

    await booking.save();

    res.redirect("/bookings");
  } catch (err) {
    console.log("Cancel Booking Error:", err);
    res.redirect("/bookings");
  }
};

exports.getHostBookings = async (req, res, next) => {
  try {

    const hostId = req.session.user._id;

    const bookings = await Booking.find({
      hostId
    })
      .populate("homeId")
      .populate("guestId");

    // Dashboard Statistics
    const totalRequests = bookings.length;

    const pending = bookings.filter(
      booking => booking.status === "Pending"
    ).length;

    const confirmed = bookings.filter(
      booking => booking.status === "Confirmed"
    ).length;

    const rejected = bookings.filter(
      booking => booking.status === "Rejected"
    ).length;

    const cancelled = bookings.filter(
      booking => booking.status === "Cancelled"
    ).length;

    const expectedRevenue = bookings
      .filter(booking => booking.status === "Confirmed")
      .reduce((total, booking) => total + booking.totalPrice, 0);

    res.render("host/host-bookings", {

      bookings,

      totalRequests,
      pending,
      confirmed,
      rejected,
      cancelled,
      expectedRevenue,

      pageTitle: "Booking Requests",
      currentPage: "host-bookings",

    });

  } catch (err) {

    console.log("Host Booking Error:", err);

    res.redirect("/");

  }
};

exports.acceptBooking = async (req, res, next) => {
  try {
    const bookingId = req.params.bookingId;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.redirect("/bookings/host");
    }

    // Only the owner (host) can accept
    if (booking.hostId.toString() !== req.session.user._id) {
      return res.redirect("/");
    }

    booking.status = "Confirmed";

    await booking.save();

    res.redirect("/bookings/host");
  } catch (err) {
    console.log("Accept Booking Error:", err);

    res.redirect("/bookings/host");
  }
};

exports.rejectBooking = async (req, res, next) => {
  try {
    const bookingId = req.params.bookingId;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.redirect("/bookings/host");
    }

    // Only the owner (host) can reject
    if (booking.hostId.toString() !== req.session.user._id) {
      return res.redirect("/");
    }

    booking.status = "Rejected";

    await booking.save();

    res.redirect("/bookings/host");
  } catch (err) {
    console.log("Reject Booking Error:", err);

    res.redirect("/bookings/host");
  }
};
