const SibApiV3Sdk = require("@getbrevo/brevo");

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

apiInstance.setApiKey(
  SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

const sendOtp = async (email, otp, firstName) => {
  console.log("Sending OTP...");
  console.log("To:", email);

  try {
    await apiInstance.sendTransacEmail({
      sender: {
        name: "HomeSpace",
        email: "abhayshakya6395@gmail.com",
      },

      to: [
        {
          email: email,
          name: firstName,
        },
      ],

      subject: "Verify Your HomeSpace Account",

      htmlContent: `
        <h2>Hello ${firstName},</h2>
        <p>Your OTP for HomeSpace verification is:</p>
        <h1 style="letter-spacing:5px;">${otp}</h1>
        <p>This OTP is valid for 5 minutes.</p>
      `,
    });

    console.log("✅ OTP Email Sent Successfully");
  } catch (err) {
    console.log("❌ SEND OTP ERROR");
    console.log(err.response?.body || err);
    throw err;
  }
};

module.exports = sendOtp;