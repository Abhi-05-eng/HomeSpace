const Home = require("../models/home");
const fs = require("fs");
const path = require("path");

exports.getAddHome = (req, res, next) => {
  res.render("host/add-home", {
    pageTitle: "Add Home",
    currentPage: "addHome",
    editing: false,
  });
};

exports.getEditHome = async (req, res, next) => {
  try {
    const homeId = req.params.homeId;
    const editing = req.query.editing === "true";

    if (!editing) {
      return res.redirect("/host/host-home-list");
    }

    const home = await Home.findById(homeId);

    if (!home) {
      return res.redirect("/host/host-home-list");
    }
    if (home.userId?.toString() !== req.session.user?._id) {
      return res.redirect("/");
    }

    res.render("host/add-home", {
      home: home,
      pageTitle: "Edit Home",
      currentPage: "host-homes",
      editing: true,
      isHostPage: false
    });

  } catch (err) {
    console.log("Error in getEditHome:", err);
    res.redirect("/host/host-home-list");
  }
};

exports.getHostHomes = async (req, res, next) => {
  try {
    const homes = await Home.find({
      userId: req.session.user?._id 
    });

    res.render("host/host-home-list", {
      registeredHomes: homes,
      pageTitle: "Host Homes",
      currentPage: "host-homes",
    });

  } catch (err) {
    console.log("Error fetching homes:", err);
    res.redirect("/");
  }
};

exports.postAddHome = async (req, res, next) => {
  try {
    const { houseName, price, location, rating, description } = req.body;
    const photo = req.file ? "/uploads/"+req.file.filename :"";
    console.log(req.file);
    const home = new Home({
      houseName,
      price,
      location,
      rating,
      photo,
      description,
      userId: req.session.user._id  
    });

    await home.save();

    res.redirect("/host/host-home-list");

  } catch (err) {
    console.log("Error adding home:", err);
    res.redirect("/host/add-home");
  }
};

exports.postEditHome = async (req, res, next) => {
  try {
    const { id, houseName, price, location, rating,description } = req.body;

    const home = await Home.findById(id);

    if (!home) {
      return res.redirect("/host/host-home-list");
    }

    if (home.userId.toString() !== req.session.user._id) {
      return res.redirect("/");
    }
   if (req.file) {
    // Delete old image
    if (home.photo) {
        const oldImagePath = path.join(__dirname, "..", home.photo);

        fs.unlink(oldImagePath, (err) => {
            if (err) {
                console.log("Error deleting old image:", err);
            }
        });
    }

    // Save new image
    home.photo = "/uploads/" + req.file.filename;
}

    home.houseName = houseName;
    home.price = price;
    home.location = location;
    home.rating = rating;
    home.description = description;

    await home.save();

    res.redirect("/host/host-home-list");

  } catch (err) {
    console.log("Error editing home:", err);
    res.redirect("/host/host-home-list");
  }
};

exports.postDeleteHome = async (req, res, next) => {
  try {
    const homeId = req.params.homeId;

    const home = await Home.findById(homeId);

    if (!home) {
      return res.redirect("/host/host-home-list");
    }

    if (home.userId.toString() !== req.session.user._id) {
      return res.redirect("/");
    }

    // Delete image from uploads folder
    if (home.photo) {
      const imagePath = path.join(__dirname, "..", home.photo);

      fs.unlink(imagePath, (err) => {
        if (err) {
          console.log("Error deleting image:", err);
        }
      });
    }

    // Delete home from MongoDB
    await Home.findByIdAndDelete(homeId);

    res.redirect("/host/host-home-list");

  } catch (err) {
    console.log("Error deleting home:", err);
    res.redirect("/host/host-home-list");
  }
};