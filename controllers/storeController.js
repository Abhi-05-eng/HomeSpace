const Home = require("../models/home");
const User = require("../models/user");

exports.getIndex = async (req, res, next) => {
  try {
    const homes = await Home.find();

    res.render("store/index", {
      registeredHomes: homes,
      pageTitle: "Airbnb Home",
      currentPage: "index",
    });

  } catch (err) {
    console.log("Error loading index:", err);
    res.redirect("/");
  }
};

exports.getHomes = async (req, res, next) => {
  try {
    const homes = await Home.find();

    res.render("store/home-list", {
      registeredHomes: homes,
      pageTitle: "Homes List",
      currentPage: "homes",
    });

  } catch (err) {
    console.log("Error loading homes:", err);
    res.redirect("/");
  }
};

exports.getBookings = (req, res, next) => {
  res.render("store/bookings", {
    pageTitle: "My Bookings",
    currentPage: "bookings",
  });
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

    res.render("store/home-detail", {
      home,
      pageTitle: "Home Detail",
      currentPage: "homes",
      isHostPage: true
    });

  } catch (err) {
    console.log("Error fetching home details:", err);
    res.redirect("/homes");
  }
};