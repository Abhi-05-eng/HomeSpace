const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const sendOtp = require("../utils/sendOtp");

// ================= LOGIN PAGE =================
exports.getLogin = (req, res, next) => {
  res.render("auth/login", {
    pageTitle: "Login",
    currentPage: "login",
    isLoggedIn: false,
    errors: [],
    oldInput: { email: "" },
    user: null,
  });
};

// ================= SIGNUP PAGE =================
exports.getSignup = (req, res, next) => {
  res.render("auth/signup", {
    pageTitle: "Signup",
    currentPage: "signup",
    isLoggedIn: false,
    errors: [],
    oldInput: { firstName:"", lastName:"", email:"", userType:"" },
    user: null,
  });
};

// ================= SIGNUP =================
exports.postSignup = [
  check("firstName").trim().notEmpty().isLength({ min: 3 }),
  check("lastName").trim().notEmpty().isLength({ min: 3 }),
  check("email").isEmail().normalizeEmail(),
  check("password").isLength({ min: 8 }),
  check("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) throw new Error("Passwords do not match");
    return true;
  }),
  check("userType").isIn(["guest", "host"]),
  check("terms").custom(v => v === "on"),

  async (req, res, next) => {
    try {
      const { firstName, lastName, email, password, userType } = req.body;
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(422).render("auth/signup", {
          pageTitle: "Signup",
          currentPage: "signup",
          isLoggedIn: false,
          errors: errors.array().map(e => e.msg),
          oldInput: req.body,
          user: null,
        });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(422).render("auth/signup", {
          pageTitle: "Signup",
          currentPage: "signup",
          isLoggedIn: false,
          errors: ["Email already exists"],
          oldInput: req.body,
          user: null,
        });
      }

// Hash password
const hashedPassword = await bcrypt.hash(password, 12);

// Generate 6-digit OTP
const otp = Math.floor(100000 + Math.random() * 900000).toString();

// Store pending user in session
req.session.pendingUser = {
  firstName,
  lastName,
  email,
  password: hashedPassword,
  userType,
  otp,
  expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
};

// Send OTP Email
await sendOtp(email, otp, firstName);

// Save session
req.session.save(err => {

  if (err) {
    console.log(err);
    return res.redirect("/signup");
  }

  res.redirect("/verify-otp");

});

    } catch (err) {
      console.log(err);
      res.redirect("/signup");
    }
  }
];

// ================= VERIFY OTP PAGE =================
exports.getVerifyOtp = (req, res, next) => {

  if (!req.session.pendingUser) {
    return res.redirect("/signup");
  }

  res.render("auth/verify-otp", {
    pageTitle: "Verify OTP",
    currentPage: "verify-otp",
    isLoggedIn: false,
    user: null,
    errors: [],
    email: req.session.pendingUser.email,
  });

};

// ================= VERIFY OTP =================
exports.postVerifyOtp = async (req, res, next) => {

  try {

    const { otp } = req.body;

    const pendingUser = req.session.pendingUser;

    // No pending signup
    if (!pendingUser) {

      req.flash("error", "Signup session expired.");

      return res.redirect("/signup");
    }

    // OTP expired
    if (Date.now() > pendingUser.expiresAt) {

      req.flash("error", "OTP has expired. Please register again.");

      delete req.session.pendingUser;

      return res.redirect("/signup");
    }

    // Wrong OTP
    if (otp !== pendingUser.otp) {

      return res.status(422).render("auth/verify-otp", {

        pageTitle: "Verify OTP",
        currentPage: "verify-otp",
        isLoggedIn: false,
        user: null,
        email: pendingUser.email,
        errors: ["Invalid OTP"]

      });

    }

    // Create User
    const user = new User({

      firstName: pendingUser.firstName,
      lastName: pendingUser.lastName,
      email: pendingUser.email,
      password: pendingUser.password,
      userType: pendingUser.userType

    });

    await user.save();

    // Login User
    req.session.isLoggedIn = true;

    req.session.user = {

      _id: user._id.toString(),
      firstName: user.firstName,
      email: user.email,
      userType: user.userType

    };

    delete req.session.pendingUser;

    req.flash(
      "success",
      "Email verified successfully. Welcome to HomeSpace!"
    );

    req.session.save(err => {

      if (err) {
        console.log(err);
      }

      res.redirect("/");

    });

  } catch (err) {

    console.log(err);

    res.redirect("/signup");

  }

};

// ================= RESEND OTP =================
exports.postResendOtp = async (req, res, next) => {

  try {

    const pendingUser = req.session.pendingUser;

    if (!pendingUser) {

      req.flash("error", "Signup session expired.");

      return res.redirect("/signup");

    }

    // Generate new OTP
    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Update session
    pendingUser.otp = otp;
    pendingUser.expiresAt = Date.now() + 5 * 60 * 1000;

    req.session.pendingUser = pendingUser;

    // Send new OTP
    await sendOtp(
      pendingUser.email,
      otp,
      pendingUser.firstName
    );

    req.flash(
      "success",
      "A new OTP has been sent to your email."
    );

    req.session.save(err => {

      if (err) {
        console.log(err);
      }

      res.redirect("/verify-otp");

    });

  } catch (err) {

    console.log(err);

    req.flash(
      "error",
      "Unable to resend OTP."
    );

    res.redirect("/verify-otp");

  }

};

// ================= LOGIN =================
exports.postLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(422).render("auth/login", {
        pageTitle: "Login",
        currentPage: "login",
        isLoggedIn: false,
        errors: ["Invalid Email or Password"],
        oldInput: { email },
        user: null,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(422).render("auth/login", {
        pageTitle: "Login",
        currentPage: "login",
        isLoggedIn: false,
        errors: ["Invalid Password"],
        oldInput: { email },
        user: null,
      });
    }

    // ✅ SESSION FIX (IMPORTANT)
    req.session.isLoggedIn = true;
    req.session.user = {
      _id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      userType: user.userType   // 🔥 REQUIRED
    };

    req.session.save(err => {
      if (err) console.log(err);
      res.redirect("/");
    });

  } catch (err) {
    console.log(err);
    res.redirect("/login");
  }
};

// ================= LOGOUT =================
exports.postLogout = (req, res, next) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
};