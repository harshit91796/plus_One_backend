const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: "rajputharshit48@gmail.com",
        pass: 'qjwb tebp ndop ybah',
    },
});

const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: 'ironman146k@gmail.com',
    subject: 'Test Email',
    text: 'This is a test email to verify Nodemailer setup.',
};

transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.log('Error occurred:', error.message);
    } else {
        console.log('Email sent:', info.response);
    }
});
