// utils/sendEmail.js
const nodemailer = require('nodemailer');

exports.connect = () => {
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,   // e.g., smtp.gmail.com
      port: 465,                     // SSL port for Gmail
      secure: true,                  // use TLS
      auth: {
        user: process.env.MAIL_USER, // your email address
        pass: process.env.MAIL_PASS  // your email password or app-password
      },
      tls: {
        rejectUnauthorized: false    // allow self-signed certs if necessary
      }
    });

    // Verify connection configuration
    transporter.verify((err, success) => {
      if (err) {
        console.error("❌ Mail server connection error:", err);
      } else {
        console.log("✅ Mail server is ready to send messages");
      }
    });

    return transporter;
  } catch (error) {
    console.log("Error setting up mail transporter:", error);
  }
};
