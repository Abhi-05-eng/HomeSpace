require("dotenv").config();

const nodemailer = require("nodemailer");

async function test() {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    await transporter.verify();
    console.log("✅ SMTP Login Successful");
  } catch (err) {
    console.error("❌ SMTP Login Failed");
    console.error(err);
  }
}

test();