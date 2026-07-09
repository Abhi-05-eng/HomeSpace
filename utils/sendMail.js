const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({

    host: process.env.SMTP_HOST,

    port: Number(process.env.SMTP_PORT),

    secure: false,

    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }

});

const sendMail = async (to, subject, html) => {

    try {

        await transporter.sendMail({

            from: process.env.EMAIL_FROM,

            to,

            subject,

            html

        });

        console.log("✅ Email Sent Successfully");

    } catch (err) {

        console.log("❌ Email Error");

        console.log(err);

    }

};

module.exports = sendMail;