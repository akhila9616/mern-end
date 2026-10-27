const express = require('express');
const { check } = require('express-validator');
const {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Validation checks for registration
const registerValidation = [
  check('name', 'Name is required and cannot be empty').trim().notEmpty(),
  check('email', 'Please provide a valid email address').isEmail().normalizeEmail(),
  check('password', 'Password must be at least 6 characters long').isLength({ min: 6 }),
];

// Validation checks for login
const loginValidation = [
  check('email', 'Please provide a valid email address').isEmail().normalizeEmail(),
  check('password', 'Password is required').exists().notEmpty(),
];

// Auth routes
router.post('/register', registerValidation, registerUser);
router.post('/login', loginValidation, loginUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);

module.exports = router;
