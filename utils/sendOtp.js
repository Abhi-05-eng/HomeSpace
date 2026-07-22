const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendOtp = async (email, otp, firstName) => {

  console.log("Sending OTP...");
  console.log("To:", email);

  try {

    await transporter.verify();
    console.log("✅ SMTP Verified");

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
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