import nodemailer from 'nodemailer';

export default async function sendEmail(options: {
  email: string;
  subject: string;
  message: string;
}) {
  let transporter = nodemailer.createTransport({
    // TS - error is wrong, options do actually work with these fields
    // @ts-ignore
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  // send mail with defined transport object
  const message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  const info = await transporter.sendMail(message);

  console.log('Message sent: %s', info.messageId);
}
