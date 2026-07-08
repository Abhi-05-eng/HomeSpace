const Home = require("../models/home");
const User = require("../models/user");
const Review = require("../models/review");
const Booking = require("../models/booking");

exports.getIndex = async (req, res, next) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = 9; // 9 homes per page
    const skip = (page - 1) * limit;

    // Get all filters from URL
    const search = req.query.search || "";
    const location = req.query.location || "";
    const minPrice = req.query.minPrice || "";
    const maxPrice = req.query.maxPrice || "";
    const rating = req.query.rating || "";
    const sort = req.query.sort || "";

    // Dynamic MongoDB Query
    const query = {};

    // House Name
    if (search) {
      query.houseName = {
        $regex: search,
        $options: "i",
      };
    }

    // Location
    if (location) {
      query.location = {
        $regex: location,
        $options: "i",
      };
    }

    // Price
    if (minPrice || maxPrice) {
      query.price = {};

      if (minPrice) {
        query.price.$gte = Number(minPrice);
      }

      if (maxPrice) {
        query.price.$lte = Number(maxPrice);
      }
    }

    // Rating
    if (rating) {
      query.rating = {
        $gte: Number(rating),
      };
    }

    // Sorting
    let sortOption = {};

    switch (sort) {
      case "priceAsc":
        sortOption.price = 1;
        break;

      case "priceDesc":
        sortOption.price = -1;
        break;

      case "ratingDesc":
        sortOption.rating = -1;
        break;

      case "newest":
        sortOption.createdAt = -1;
        break;

      default:
        sortOption = {};
    }

    const totalHomes = await Home.countDocuments(query);

    const homes = await Home.find(query)
    .sort(sortOption)
    .skip(skip)
    .limit(limit);

    const totalPages = Math.ceil(totalHomes / limit);

    res.render("store/index", {
      registeredHomes: homes,
      pageTitle: "Airbnb Home",
      currentPage: "index",

      page,
      totalPages,
      totalHomes,
      search,
      location,
      minPrice,
      maxPrice,
      rating,
      sort,
    });

  } catch (err) {
    console.log("Error loading index:", err);
    res.redirect("/");
  }
};

exports.getHomes = async (req, res, next) => {
  try {

    // Get all filters from URL
    const search = req.query.search || "";
    const location = req.query.location || "";
    const minPrice = req.query.minPrice || "";
    const maxPrice = req.query.maxPrice || "";
    const rating = req.query.rating || "";
    const sort = req.query.sort || "";

    // Dynamic MongoDB Query
    const query = {};

    // House Name
    if (search) {
      query.houseName = {
        $regex: search,
        $options: "i"
      };
    }

    // Location
    if (location) {
      query.location = {
        $regex: location,
        $options: "i"
      };
    }

    // Price
    if (minPrice || maxPrice) {

      query.price = {};

      if (minPrice) {
        query.price.$gte = Number(minPrice);
      }

      if (maxPrice) {
        query.price.$lte = Number(maxPrice);
      }

    }

    // Rating
    if (rating) {
      query.rating = {
        $gte: Number(rating)
      };
    }

    let sortOption = {};

switch (sort) {

    case "priceAsc":
        sortOption.price = 1;
        break;

    case "priceDesc":
        sortOption.price = -1;
        break;

    case "ratingDesc":
        sortOption.rating = -1;
        break;

    case "newest":
        sortOption.createdAt = -1;
        break;

    default:
        sortOption = {};
}

    // Fetch Homes
   const homes = await Home.find(query).sort(sortOption);

    res.render("store/home-list", {
      registeredHomes: homes,
      pageTitle: "Homes List",
      currentPage: "homes",

      search,
      location,
      minPrice,
      maxPrice,
      rating,
      sort

    });

  } catch (err) {

    console.log("Search Error:", err);

    res.redirect("/");

  }
};

exports.getFavouriteList = async (req, res, next) => {
  try {

    const userId = req.session.user?._id;

    if (!userId) {
      return res.redirect("/login");
    }

    const user = await User.findById(userId)
      .populate("favourites");

    res.render("store/favourite-list", {
      favouriteHomes: user.favourites || [],
      pageTitle: "My Favourites",
      currentPage: "favourites",
    });

  } catch (err) {
    console.log("Error loading favourites:", err);
    res.redirect("/");
  }
};

exports.postAddToFavourite = async (req, res, next) => {
  try {

    const homeId = req.body.id;
    const userId = req.session.user?._id;

    if (!userId) {
      return res.redirect("/login");
    }

    const user = await User.findById(userId);

    const alreadyExists = user.favourites.some(
      fav => fav.toString() === homeId
    );

    if (!alreadyExists) {
      user.favourites.push(homeId);
      await user.save();
    }

    res.redirect("/favourites");

  } catch (err) {
    console.log("Error adding favourite:", err);
    res.redirect("/homes");
  }
};

exports.postRemoveFromFavourite = async (req, res, next) => {
  try {

    const homeId = req.params.homeId;
    const userId = req.session.user?._id;

    const user = await User.findById(userId);

    user.favourites = user.favourites.filter(
      fav => fav.toString() !== homeId
    );

    await user.save();

    res.redirect("/favourites");

  } catch (err) {
    console.log("Error removing favourite:", err);
    res.redirect("/favourites");
  }
};

exports.getHomeDetails = async (req, res, next) => {
  try {

    const homeId = req.params.homeId;

    const home = await Home.findById(homeId);

    if (!home) {
      return res.redirect("/homes");
    }

    // Fetch reviews
    const reviews = await Review.find({
      homeId,
    })
      .populate("guestId", "firstName lastName")
      .sort({ createdAt: -1 });

    let canReview = false;

    if (
      req.session.user &&
      req.session.user.userType === "guest"
    ) {

      const guestId = req.session.user._id;

      // Completed booking exists?
      const booking = await Booking.findOne({

        homeId,
        guestId,

        status: "Confirmed",

        // checkOut: {
        //   $lt: new Date(),
        // },

      });

      // Already reviewed?
      const existingReview = await Review.findOne({
        homeId,
        guestId,
      });

      canReview = !!booking && !existingReview;

    }

    res.render("store/home-detail", {

      home,
      reviews,
      canReview,

      pageTitle: "Home Detail",
      currentPage: "homes",

      isHostPage: true,
      userType: req.session.user?.userType || null,

    });

  } catch (err) {

    console.log("Error fetching home details:", err);

    res.redirect("/homes");

  }
};