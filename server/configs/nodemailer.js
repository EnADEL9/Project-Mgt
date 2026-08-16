import 'dotenv/config';
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const sendEmail = async ({ to, subject, body }) => {
    if (!to || !subject || !body) {
        console.error("Email request missing required fields.", { to, subject, bodyLength: body?.length || 0 });
        return null;
    }

    try {
        const info = await transporter.sendMail({
            from: process.env.SENDER_EMAIL,
            to,
            subject,
            html: body,
        });

        console.log("Message sent:", info.messageId);
        return info;
    } catch (err) {
        console.error("Error while sending mail:", err);
        return null;
    }
};

export default sendEmail;