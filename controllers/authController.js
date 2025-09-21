const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { validationResult } = require('express-validator');

// Render login page
const renderLogin = (req, res) => {
  // Check if user is already logged in
  const token = req.cookies.token;
  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Redirect based on role
      switch (decoded.role) {
        case 'Student':
          return res.redirect('/student/dashboard');
        case 'Faculty':
          return res.redirect('/faculty/dashboard');
        case 'Admin':
          return res.redirect('/admin/dashboard');
      }
    } catch (error) {
      // Invalid token, continue to login page
      res.clearCookie('token');
    }
  }

  res.render('login', {
    title: 'Login - Lab Exam Portal',
    error: req.query.error || null,
    success: req.query.success || null
  });
};

// Handle login
const login = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('login', {
        title: 'Login - Lab Exam Portal',
        error: errors.array()[0].msg,
        success: null
      });
    }

    const { username, password, role } = req.body;

    // Find user by username or email with specified role
    const user = await User.findOne({
      $or: [{ username }, { email: username }],
      role: role
    });

    if (!user) {
      return res.render('login', {
        title: 'Login - Lab Exam Portal',
        error: `Invalid credentials or incorrect role selection.`,
        success: null
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.render('login', {
        title: 'Login - Lab Exam Portal',
        error: 'Your account has been deactivated. Contact administrator.',
        success: null
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.render('login', {
        title: 'Login - Lab Exam Portal',
        error: 'Invalid credentials.',
        success: null
      });
    }

    // Update last login
    await user.updateLastLogin();

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    // Set cookie with token
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    // Redirect based on role
    switch (user.role) {
      case 'Student':
        res.redirect('/student/dashboard');
        break;
      case 'Faculty':
        res.redirect('/faculty/dashboard');
        break;
      case 'Admin':
        res.redirect('/admin/dashboard');
        break;
      default:
        res.redirect('/auth/login?error=Invalid user role');
    }

  } catch (error) {
    console.error('Login error:', error);
    res.render('login', {
      title: 'Login - Lab Exam Portal',
      error: 'Server error. Please try again later.',
      success: null
    });
  }
};

// Render signup page (for testing only)
const renderSignup = (req, res) => {
  res.render('signup', {
    title: 'Sign Up - Lab Exam Portal',
    error: req.query.error || null,
    success: req.query.success || null
  });
};

// Handle signup (for testing only)
const signup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('signup', {
        title: 'Sign Up - Lab Exam Portal',
        error: errors.array()[0].msg,
        success: null
      });
    }

    const { username, email, password, role, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.render('signup', {
        title: 'Sign Up - Lab Exam Portal',
        error: 'Username or email already exists.',
        success: null
      });
    }

    // Create new user
    const newUser = new User({
      username,
      email,
      password,
      role,
      firstName,
      lastName
    });

    await newUser.save();

    res.render('signup', {
      title: 'Sign Up - Lab Exam Portal',
      error: null,
      success: 'Account created successfully! You can now login.'
    });

  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.render('signup', {
        title: 'Sign Up - Lab Exam Portal',
        error: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`,
        success: null
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errorMessage = Object.values(error.errors)[0].message;
      return res.render('signup', {
        title: 'Sign Up - Lab Exam Portal',
        error: errorMessage,
        success: null
      });
    }

    res.render('signup', {
      title: 'Sign Up - Lab Exam Portal',
      error: 'Server error. Please try again later.',
      success: null
    });
  }
};

// Handle logout
const logout = (req, res) => {
  res.clearCookie('token');
  res.redirect('/auth/login?success=Logged out successfully');
};

module.exports = {
  renderLogin,
  login,
  renderSignup,
  signup,
  logout
};
