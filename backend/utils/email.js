const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // Change to false to use TLS instead of SSL
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      // Do not fail on invalid certs
      rejectUnauthorized: false
    }
  });

  // Define email options
  const mailOptions = {
    from: `Planning-Corporate <${process.env.EMAIL_FROM}>`,
    to: options.email,
    subject: options.subject,
    html: options.html
  };

  // Send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;