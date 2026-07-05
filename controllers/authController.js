const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const User = require("../models/user");

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

      const hashedPassword = await bcrypt.hash(password, 12);

      const user = new User({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        userType,
      });

      await user.save();
      res.redirect("/login");

    } catch (err) {
      console.log(err);
      res.redirect("/signup");
    }
  }
];

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