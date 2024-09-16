// /controllers/authController.js
const User = require('../models/User');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const passport = require('passport');
const twilio = require('twilio');
dotenv.config();

const registerUser = async (req, res) => {
    const { name, email, password,age } = req.body;
    console.log('hiiiii',req.body);
     // Validate required fields
     if (!name || !email || !password || !age) {
    console.log('hii',password);

        return res.status(400).json({ error: 'All fields are required' });
    }
    console.log('ii',password);
   
    try {
        const user = new User({ name, email, password, age });
         await user.save();

         if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not set in environment variables.');
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        res.status(201).json({ token });
    } catch (err) {
        console.error(err);  // Logs the error for debugging
        res.status(400).json({ error: 'User registration failed', details: err.message });
    }
    
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        res.status(200).json({data : user , token});
    } catch (err) {
        res.status(400).json({ error: 'User login failed' });
    }
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const resetToken = user.generateResetToken();
        
        await user.save();

        const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;

        // Send email (setup your own email service)
        const transporter = nodemailer.createTransport({
            service: 'Gmail', // Use your email provider
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const message = `You requested a password reset. Please make a PUT request to: \n\n ${resetUrl}`;

        await transporter.sendMail({
            to: user.email,
            subject: 'Password Reset Request',
            text: message,
        });

        res.status(200).json({ success: true, data: 'Email sent' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

const resetPassword = async (req, res) => {
    try {
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
        console.log("Received Token:", req.params.token);
        console.log("Hashed Token:", hashedToken);
        // await new Promise(resolve => setTimeout(resolve, 1000)); 


    
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() },
        });
    
        if (!user) {
            console.log("No matching user found or token expired");
            return res.status(400).json({ error: 'Invalid or expired token' });
        }
    
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
    
        await user.save();
    
        res.status(200).json({ success: true, data: 'Password reset successful' });
    } catch (err) {
        console.error("Error in resetPassword:", err);
        res.status(500).json({ error: 'Server error' });
    }
    
};

const oauthLogin = (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
        expiresIn: '1h',
    });
    res.status(200).json({ data: req.user, token });
};

const sendOtp = async (req, res) => {
    const { phoneNumber } = req.body;
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    try {
        const verification = await client.verify.v2.services(process.env.TWILIO_SERVICE_SID)
            .verifications
            .create({ to: phoneNumber, channel: 'sms' });
        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
        res.status(400).json({ error: 'Failed to send OTP' });
    }
};

const verifyOtp = async (req, res) => {
    console.log("verifyOtp");
    const { phoneNumber, otp } = req.body;
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    try {
        const verification_check = await client.verify.v2.services(process.env.TWILIO_SERVICE_SID)
            .verificationChecks
            .create({ to: phoneNumber, code: otp });

        if (verification_check.status === 'approved') {
            let user = await User.findOne({ phoneNumber });
            console.log("user");
            if (!user) {
                user = new User({ phoneNumber });
                await user.save();
            }

            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
                expiresIn: '1h',
            });

            res.status(200).json({ data: user, token });
        } else {
            res.status(400).json({ error: 'Invalid OTP' });
        }
    } catch (error) {
        res.status(400).json({ error: 'OTP verification failed' });
    }
};

const updateUser = async (req, res) => {
    console.log("updateUser function called");
    try {
        // Find the user by ID and update
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { $set: req.body },
            { new: true, runValidators: true, context: 'query' }
        ).select('-password'); // Exclude the password field from the response

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        console.log("Updated user:", updatedUser);
        res.status(200).json({ data: updatedUser });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(400).json({ error: 'User update failed', details: error.message });
    }
};

const generateToken = (user) => {
    return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '1h',
    });
};

module.exports = { 
    registerUser,
    loginUser,
    forgotPassword,
    resetPassword,
    oauthLogin,
    sendOtp,
    verifyOtp,
    updateUser,
    generateToken
};
