const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');

const router = express.Router();

// Validation rules
const loginValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username or email is required')
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  
  body('role')
    .notEmpty()
    .withMessage('Please select a role')
    .isIn(['Student', 'Faculty', 'Admin'])
    .withMessage('Invalid role selected')
];

const signupValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  
  body('role')
    .notEmpty()
    .withMessage('Please select a role')
    .isIn(['Student', 'Faculty', 'Admin'])
    .withMessage('Invalid role selected')
];

// Routes
router.get('/login', authController.renderLogin);
router.post('/login', loginValidation, authController.login);

router.get('/signup', authController.renderSignup);
router.post('/signup', signupValidation, authController.signup);

router.get('/logout', authController.logout);
router.post('/logout', authController.logout);

module.exports = router;
