const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { ROLES } = require('../config/constants');

const register = async (req, res) => {
  try {
    const { name, email, password, role, phone, employeeId, rollNumber, year, parentOf } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and role are required.',
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists.',
      });
    }

    if (role === ROLES.ADMIN && (!req.user || req.user.role !== ROLES.ADMIN)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can create admin accounts.',
      });
    }

    if (role === ROLES.STUDENT && !rollNumber) {
      return res.status(400).json({
        success: false,
        message: 'Roll number is required for students.',
      });
    }

    if (role === ROLES.TEACHER && !employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required for teachers.',
      });
    }

    if (role === ROLES.PARENT && !parentOf) {
      return res.status(400).json({
        success: false,
        message: 'Ward reference (parentOf) is required for parent accounts.',
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      phone,
      employeeId,
      rollNumber,
      year,
      parentOf,
    });

    await AuditLog.log({
      action: 'USER_REGISTERED',
      actor: req.user ? req.user._id : user._id,
      target: `User:${user._id}`,
      details: { role, email },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    const token = user.generateToken();

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: { user, token },
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `Duplicate value for ${field}.`,
      });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password, deviceId } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Contact admin.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    let deviceBound = false;

    if (deviceId) {
      if (user.deviceId && user.deviceId !== deviceId) {
        return res.status(403).json({
          success: false,
          message: 'This account is bound to another device. Contact admin to reset.',
        });
      }

      if (!user.deviceId) {
        user.deviceId = deviceId;
        await user.save();
        deviceBound = true;
      }
    }

    const token = user.generateToken();

    await AuditLog.log({
      action: 'USER_LOGIN',
      actor: user._id,
      target: `User:${user._id}`,
      details: { role: user.role, deviceId: deviceId || null, deviceBound },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: { user, token, deviceBound },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('parentOf', 'name email rollNumber year');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;

    if (!name && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Provide at least one field to update (name or phone).',
      });
    }

    const updates = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    await AuditLog.log({
      action: 'PROFILE_UPDATED',
      actor: req.user._id,
      target: `User:${req.user._id}`,
      details: updates,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: { user },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters.',
      });
    }

    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    user.password = newPassword;
    await user.save();

    await AuditLog.log({
      action: 'PASSWORD_CHANGED',
      actor: req.user._id,
      target: `User:${req.user._id}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to change password.' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
};
