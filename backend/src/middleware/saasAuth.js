const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'school-management-secret-key-2024';

const requireSaaSAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ message: 'Access token required' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const User = require('../models/User');
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }
    
    // Check if user is super admin
    if (!user.isSuperAdmin && user.role?.code !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Super Admin access required' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    res.status(500).json({ message: 'Authentication error' });
  }
};

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ message: 'Access token required' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const User = require('../models/User');
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }
    
    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(423).json({ message: 'Account is locked. Please try again later.' });
    }
    
    req.user = user;
    
    // Build tenant query for school-based access
    const schoolId = req.headers['x-school-id'] || decoded.school;
    if (schoolId) {
      // Verify user has access to this school
      if (!user.isSuperAdmin && user.school?.toString() !== schoolId) {
        return res.status(403).json({ message: 'Access denied to this school' });
      }
      req.tenantQuery = { school: schoolId };
    } else if (!user.isSuperAdmin && user.school) {
      req.tenantQuery = { school: user.school };
    }
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    res.status(500).json({ message: 'Authentication error' });
  }
};

module.exports = {
  requireSaaSAdmin,
  requireAuth
};
