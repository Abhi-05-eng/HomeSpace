const nodemailer = require("nodemailer");

console.log("EMAIL_USER =", process.env.EMAIL_USER);
console.log("EMAIL_PASS length =", process.env.EMAIL_PASS?.length);

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOtp = async (email, otp, firstName) => {

  console.log("Sending OTP...");
  console.log("To:", email);

  try {

    await transporter.verify();
    console.log("✅ SMTP Verified");

    const info = await transporter.sendMail({
      from: `"HomeSpace" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify Your HomeSpace Account",
      html: `
      <h2>Hello ${firstName}</h2>
      <h1>${otp}</h1>
      `
    });

    console.log("Mail Sent:", info.messageId);

  } catch (err) {

    console.log("SEND OTP ERROR");
    console.log(err);

    throw err;

  }

};
module.exports = sendOtp;