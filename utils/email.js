const nodemailer = require('nodemailer');
const Transport = require('nodemailer-brevo-transport');
const { convert } = require('html-to-text');
const pug = require('pug');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Swayam Goswami <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      const transporter = nodemailer.createTransport(
        new Transport({ apiKey: process.env.BREVO_PASSWORD })
      );
      return transporter;
    }

    return nodemailer.createTransport({
      host: `${process.env.EMAIL_HOST}`,
      port: process.env.EMAIL_PORT,
      secure: false,
      logger: true,
      auth: {
        user: `${process.env.EMAIL_USERNAME}`,
        pass: `${process.env.EMAIL_PASSWORD}`,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async send(template, subject) {
    // Send the actual email
    // Render html for email
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      subject,
      url: this.url,
    });

    // Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: convert(html, { wordwrap: false }),
    };

    // Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset Token (valid for 10 minutes'
    );
  }
};
