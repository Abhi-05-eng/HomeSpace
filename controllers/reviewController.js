const Review = require("../models/review");
const Booking = require("../models/booking");
const Home = require("../models/home");

// ================= ADD REVIEW =================

exports.postReview = async (req, res) => {
  try {

    const homeId = req.params.homeId;
    const guestId = req.session.user._id;

    const { rating, comment } = req.body;

    // Check completed booking
    const booking = await Booking.findOne({
      homeId,
      guestId,
      status: "Confirmed",
      // checkOut: { $lt: new Date() }
    });

    if (!booking) {

      req.flash(
        "error",
        "You can review this home only after completing your stay."
      );

      return res.redirect(`/homes/${homeId}`);
    }

    // Prevent duplicate review
    const existingReview = await Review.findOne({
      homeId,
      guestId,
    });

    if (existingReview) {

      req.flash(
        "error",
        "You have already reviewed this home."
      );

      return res.redirect(`/homes/${homeId}`);
    }

    // Save review
    const review = new Review({

      homeId,
      guestId,
      bookingId: booking._id,

      rating,
      comment,

    });

    await review.save();

    // Update Home Rating
    const reviews = await Review.find({ homeId });

    const totalReviews = reviews.length;

    const averageRating =
      reviews.reduce(
        (sum, review) => sum + review.rating,
        0
      ) / totalReviews;

    await Home.findByIdAndUpdate(homeId, {

      rating: averageRating.toFixed(1),
      totalReviews,

    });

    req.flash(
      "success",
      "Thank you for your review!"
    );

    res.redirect(`/homes/${homeId}`);

  } catch (err) {

    console.log(err);

    res.redirect("/");

  }
};