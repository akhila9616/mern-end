const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication middleware to verify JWT token and attach user to req.user
 */
const protect = async (req, res, next) => {
  let token;

  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route, no token provided',
      });
    }

    // Verify token
    const JWT_SECRET = process.env.JWT_SECRET || 'taskflow_jwt_secret_key_2024';
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch user from DB and attach to req.user (excluding password)
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, user not found',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token invalid or expired',
    });
  }
};

module.exports = { protect };
