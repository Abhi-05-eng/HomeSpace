// Core Module
const path = require('path');

// External Module
const express = require('express');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const mongoose = require('mongoose');
const multer = require('multer');

// Local Module
const storeRouter = require("./routes/storeRouter");
const hostRouter = require("./routes/hostRouter");
const authRouter = require("./routes/authRouter");
const rootDir = require("./utils/pathUtil");
const errorsController = require("./controllers/errors");

const DB_PATH = "mongodb://127.0.0.1:27017/airbnb";

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

app.use(express.urlencoded({ extended: true }));

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

app.use(session({

  secret: "abhay shakya",

  resave: false,

  saveUninitialized: false,

  store: store

}));

app.use((req, res, next) => {

  res.locals.isLoggedIn =
    req.session?.isLoggedIn || false;

  res.locals.user =
    req.session?.user || null;

  next();
});

app.use(authRouter);

app.use(storeRouter);

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

  res.status(500).render("error", {
    pageTitle: "Error",
    errorMessage: error.message
  });
});

const PORT = 3000;

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