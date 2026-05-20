const nodemailer = require('nodemailer');

const createTransporter = async () => {
  if (process.env.EMAIL_HOST && process.env.EMAIL_PORT) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: process.env.EMAIL_USER && process.env.EMAIL_PASS ? {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      } : undefined,
    });
  }

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = await createTransporter();

    const mailOptions = {
      from: `"Fixvo Platform" <${process.env.EMAIL_FROM || process.env.EMAIL_USER || 'no-reply@fixvo.com'}>`,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);

    if (!process.env.EMAIL_HOST && !process.env.EMAIL_USER) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('Ethereal preview URL:', previewUrl);
    }

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

module.exports = sendEmail;
