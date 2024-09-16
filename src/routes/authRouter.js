const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { registerUser, loginUser } = authController;
const passport = require('../config/passportConfig');
const { protect } = require('../middlewares/authMiddleware');
// const { protect } = require('../middleware/authMiddleware');


router.post('/register', registerUser);
router.post('/login', loginUser);
// router.get('/me', protect, (req, res) => {
//     res.send(req.user);
// });

// OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    const token = authController.generateToken(req.user);
    console.log("user",req.user);
    const userData = JSON.stringify(req.user);
    // Redirect to your frontend application with the token
    res.redirect(`http://localhost:5173/oauth-callback?token=${token}&user=${encodeURIComponent(userData)}`);
  }
);

router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
router.get('/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), authController.oauthLogin);

// Phone OTP routes
router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);

// Forgot password routes
router.post('/forgot-password', authController.forgotPassword);
router.put('/reset-password/:token', authController.resetPassword);

router.put('/update-user',protect, authController.updateUser);

module.exports = router