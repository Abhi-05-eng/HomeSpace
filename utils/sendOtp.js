const { BrevoClient } = require("@getbrevo/brevo");

const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY,
});

const sendOtp = async (email, otp, firstName) => {
  console.log("Sending OTP...");
  console.log("To:", email);

  try {
    const result = await brevo.transactionalEmails.sendTransacEmail({
      sender: {
        name: "HomeSpace",
        email: "abhayshakya6395@gmail.com", // Must be a verified sender in Brevo
      },

      to: [
        {
          email,
          name: firstName,
        },
      ],

      subject: "Verify Your HomeSpace Account",

      htmlContent: `
        <h2>Hello ${firstName},</h2>
        <p>Your OTP for HomeSpace verification is:</p>
        <h1>${otp}</h1>
        <p>This OTP is valid for 5 minutes.</p>
      `,
    });

    console.log("✅ OTP Sent");
    console.log(result);

  } catch (err) {
    console.log("❌ SEND OTP ERROR");
    console.log(err);
    throw err;
  }
};

module.exports = sendOtp;