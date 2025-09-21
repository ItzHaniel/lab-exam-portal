const User = require('../models/User');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Update profile information
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, email, username } = req.body;
    const userId = req.user._id;
    
    // Validation
    if (!firstName || !lastName || !email || !username) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    // Check if email or username already exists (for other users)
    const existingUser = await User.findOne({
      $and: [
        { _id: { $ne: userId } },
        {
          $or: [
            { email: email.toLowerCase() },
            { username: username.toLowerCase() }
          ]
        }
      ]
    });
    
    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'Email' : 'Username';
      return res.status(400).json({
        success: false,
        message: `${field} already exists for another user`
      });
    }
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        username: username.toLowerCase().trim(),
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Return success (don't send password)
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        username: updatedUser.username,
        role: updatedUser.role,
        profileImage: updatedUser.profileImage
      }
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.name === 'ValidationError') {
      const errorMessages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: errorMessages[0]
      });
    }
    
    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user._id;
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All password fields are required'
      });
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }
    
    // Password strength check
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
      });
    }
    
    // Get user with password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Check if new password is same as current
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }
    
    // Hash new password and save
    user.password = newPassword; // Pre-save middleware will hash it
    user.updatedAt = new Date();
    await user.save();
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while changing password'
    });
  }
};

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('✅ Created avatar upload directory:', uploadDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `avatar_${req.user._id}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = function (req, file, cb) {
  console.log('📄 File received:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    fieldname: file.fieldname
  });
  
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    console.log('✅ File type accepted');
    return cb(null, true);
  } else {
    console.log('❌ File type rejected');
    cb(new Error('Only image files are allowed (JPEG, JPG, PNG, GIF)'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  },
  fileFilter: fileFilter
});

// Upload profile picture - IMPROVED
const uploadAvatar = [
  upload.single('avatar'),
  async (req, res) => {
    try {
      console.log('🖼️ Avatar upload attempt by user:', req.user._id);
      console.log('📎 Request file:', req.file);
      console.log('📎 Request body:', req.body);
      
      if (!req.file) {
        console.log('❌ No file received in request');
        return res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
      }
      
      const userId = req.user._id;
      const avatarPath = `/uploads/avatars/${req.file.filename}`;
      
      console.log('💾 Saving avatar path to database:', avatarPath);
      console.log('💾 File saved at:', req.file.path);
      
      // Get current user to check for old avatar
      const currentUser = await User.findById(userId);
      
      // Delete old profile image if exists
      if (currentUser && currentUser.profileImage && currentUser.profileImage.startsWith('/uploads/')) {
        const oldImagePath = path.join(__dirname, '..', 'public', currentUser.profileImage);
        if (fs.existsSync(oldImagePath)) {
          try {
            fs.unlinkSync(oldImagePath);
            console.log('🗑️ Deleted old avatar:', oldImagePath);
          } catch (deleteError) {
            console.log('⚠️ Could not delete old avatar:', deleteError.message);
          }
        }
      }
      
      // Update user's avatar path
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { 
          profileImage: avatarPath,
          updatedAt: new Date()
        },
        { new: true }
      );
      
      if (!updatedUser) {
        console.log('❌ User not found for update');
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      console.log('✅ Avatar updated successfully for user:', userId);
      console.log('✅ New avatar URL:', avatarPath);
      
      res.json({
        success: true,
        message: 'Profile picture updated successfully',
        avatarUrl: avatarPath
      });
      
    } catch (error) {
      console.error('❌ Upload avatar error:', error);
      
      // Handle multer errors
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File size too large. Maximum size is 5MB.'
          });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            message: 'Too many files. Only one image allowed.'
          });
        }
      }
      
      res.status(500).json({
        success: false,
        message: 'Server error while uploading image: ' + error.message
      });
    }
  }
];

// Update notification preferences
const updateNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { emailExams, emailResults, emailAnnouncements, pushNotifications } = req.body;
    
    // Update user's notification preferences
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        'notificationSettings.emailExams': emailExams === 'on',
        'notificationSettings.emailResults': emailResults === 'on', 
        'notificationSettings.emailAnnouncements': emailAnnouncements === 'on',
        'notificationSettings.pushNotifications': pushNotifications === 'on',
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Notification preferences updated successfully'
    });
    
  } catch (error) {
    console.error('Update notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating notification preferences'
    });
  }
};

// Update user preferences
const updatePreferences = async (req, res) => {
  try {
    const userId = req.user._id;
    const { showUpcoming, showRecentGrades } = req.body;
    
    // Update user preferences
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        'preferences.showUpcoming': showUpcoming === 'on',
        'preferences.showRecentGrades': showRecentGrades === 'on',
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Preferences updated successfully'
    });
    
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating preferences'
    });
  }
};

module.exports = {
  updateProfile,
  changePassword,
  uploadAvatar,
  updateNotifications,
  updatePreferences
};
