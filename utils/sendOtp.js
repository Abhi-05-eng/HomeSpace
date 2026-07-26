const brevo = require("@getbrevo/brevo");

const apiInstance = new brevo.TransactionalEmailsApi();

apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
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
          email,
          name: firstName,
        },
      ],
      subject: "Verify Your HomeSpace Account",
      htmlContent: `
        <h2>Hello ${firstName}</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
      `,
    });

    console.log("✅ OTP Sent");
  } catch (err) {
    console.log("❌ SEND OTP ERROR");
    console.log(err.response?.body || err);
    throw err;
  }
};

module.exports = sendOtp; 