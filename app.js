require("dotenv").config();
// Core Module
const path = require('path');

// External Module
const express = require('express');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const mongoose = require('mongoose');
const multer = require('multer');
const methodOverride = require("method-override");
const flash = require("connect-flash");

// Local Module
const storeRouter = require("./routes/storeRouter");
const hostRouter = require("./routes/hostRouter");
const authRouter = require("./routes/authRouter");
const rootDir = require("./utils/pathUtil");
const errorsController = require("./controllers/errors");
const bookingRouter = require("./routes/bookingRouter");
const reviewRouter = require("./routes/reviewRouter");
const paymentRoutes = require("./routes/payment");

const DB_PATH = process.env.MONGODB_URI;

const app = express();


app.set('view engine', 'ejs');
app.set('views', 'views');


const store = new MongoDBStore({
  uri: DB_PATH,
  collection: 'sessions'
});


const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },

  filename: (req, file, cb) => {

    const uniqueName =
      Date.now() + "-" + file.originalname;

    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {

  const allowedMimeTypes = [
    "image/png",
    "image/jpg",
    "image/jpeg",
    "image/webp"
  ];

  const ext = path.extname(file.originalname).toLowerCase();

  const allowedExtensions = [
    ".png",
    ".jpg",
    ".jpeg",
    ".webp"
  ];

  if (
    allowedMimeTypes.includes(file.mimetype) &&
    allowedExtensions.includes(ext)
  ) {

    cb(null, true);

  } else {

    cb(
      new Error("Only image files are allowed"),
      false
    );
  }
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

app.use(

  multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024 
    }

  }).single('photo')

);

app.use(express.static(path.join(rootDir, 'public')));

app.use(
  '/uploads',
  express.static(path.join(rootDir, 'uploads'))
);

app.use(
  "/invoices",
  express.static(path.join(rootDir, "invoices"))
);

app.use(session({

  secret: "abhay shakya",

  resave: false,

  saveUninitialized: false,

  store: store

}));
app.use(flash());

app.use((req, res, next) => {

  res.locals.isLoggedIn =
    req.session?.isLoggedIn || false;

  res.locals.user =
    req.session?.user || null;

  res.locals.successMessage =
    req.flash("success");

  res.locals.errorMessage =
    req.flash("error");

  next();
});

app.use(authRouter);

app.use(storeRouter);

app.use("/bookings", bookingRouter);
app.use("/reviews", reviewRouter);
app.use("/payment", paymentRoutes);

app.use("/host", (req, res, next) => {

  if (req.session?.isLoggedIn) {

    next();

  } else {

    res.redirect("/login");
  }
});

app.use("/host", hostRouter);

app.use(errorsController.pageNotFound);

app.use((error, req, res, next) => {

  console.log(error);

  res.status(500).render("404", {
    pageTitle: "Error",
    errorMessage: error.message
  });
});

const PORT = process.env.PORT || 3000;

mongoose.connect(DB_PATH)

  .then(() => {

    console.log('Connected to DB');

    app.listen(PORT, () => {

      console.log(
        `Server running on http://localhost:${PORT}`
      );
    });
  })

  .catch(err => {

    console.log('DB connection error:', err);
  });