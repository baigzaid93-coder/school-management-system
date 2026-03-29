const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');
const AuditLog = require('../models/AuditLog');

const JWT_SECRET = process.env.JWT_SECRET || 'school-management-secret-key-2024';

exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access token required' });
    }
    
    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await User.findById(decoded.id)
      .select('-password')
      .populate('role');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }
    
    req.user = {
      id: user._id,
      email: user.email,
      username: user.username,
      role: user.role,
      permissions: user.role?.permissions || [],
      teacherId: user.teacherId,
      studentId: user.studentId,
      parentId: user.parentId,
      school: user.school,
      isSuperAdmin: user.isSuperAdmin,
      isSchoolAdmin: user.isSchoolAdmin
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.authorize = (...allowedPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    if (req.user.role?.code === 'SUPER_ADMIN') {
      return next();
    }
    
    const userPermissions = req.user.permissions || [];
    const userRole = req.user.role;
    
    const roleData = userRole?.permissions ? userRole : null;
    const allPermissions = [...new Set([...userPermissions, ...(roleData?.permissions || [])])];
    
    const hasPermission = allowedPermissions.some(permission => {
      if (permission === '*') return true;
      if (allPermissions.includes(permission)) return true;
      
      const [module] = permission.split(':');
      if (allPermissions.includes(`${module}:*`)) return true;
      if (allPermissions.includes('*:view') && permission.endsWith(':view')) return true;
      
      return false;
    });
    
    if (!hasPermission && allowedPermissions.length > 0) {
      return res.status(403).json({ 
        message: 'You do not have permission to perform this action',
        required: allowedPermissions,
        userPermissions: allPermissions
      });
    }
    
    next();
  };
};

exports.authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const userRoleCode = req.user.role?.code;
    
    if (!allowedRoles.includes(userRoleCode)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient role privileges.',
        required: allowedRoles,
        current: userRoleCode
      });
    }
    
    next();
  };
};

exports.auditLog = async (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(body) {
    res.locals.responseBody = body;
    return originalSend.call(this, body);
  };
  
  res.on('finish', async () => {
    try {
      const { action = 'VIEW', module = 'Unknown', entity, entityId } = req.auditInfo || {};
      
      if (req.user && action !== 'LOGIN' && action !== 'LOGOUT') {
        await AuditLog.create({
          user: req.user.id,
          action,
          module,
          entity: entity || 'Unknown',
          entityId,
          description: req.auditInfo?.description || `${action} on ${entity || 'unknown'}`,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent'),
          status: res.statusCode >= 400 ? 'FAILURE' : 'SUCCESS',
          oldValues: req.auditInfo?.oldValues,
          newValues: req.auditInfo?.newValues
        });
      }
    } catch (error) {
      console.error('Audit log error:', error);
    }
  });
  
  next();
};

exports.setAuditInfo = (action, module, entity, entityId, description) => {
  return (req, res, next) => {
    req.auditInfo = { action, module, entity, entityId, description };
    next();
  };
};

exports.checkOwnership = (getResourceUserId) => {
  return async (req, res, next) => {
    const resourceUserId = await getResourceUserId(req);
    
    if (req.user.role?.code === 'SUPER_ADMIN' || req.user.role?.code === 'SCHOOL_ADMIN') {
      return next();
    }
    
    if (resourceUserId && resourceUserId.toString() === req.user.id.toString()) {
      return next();
    }
    
    return res.status(403).json({ message: 'You can only access your own resources' });
  };
};

exports.rateLimit = (maxRequests = 100, windowMs = 60000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const key = req.user?.id || req.ip;
    const now = Date.now();
    const requestData = requests.get(key) || { count: 0, resetTime: now + windowMs };
    
    if (now > requestData.resetTime) {
      requestData.count = 0;
      requestData.resetTime = now + windowMs;
    }
    
    requestData.count++;
    requests.set(key, requestData);
    
    if (requestData.count > maxRequests) {
      return res.status(429).json({ 
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((requestData.resetTime - now) / 1000)
      });
    }
    
    next();
  };
};

exports.isSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  if (!req.user.isSuperAdmin && req.user.role?.code !== 'SUPER_ADMIN') {
    return res.status(403).json({ message: 'Super Admin access required' });
  }
  
  next();
};

exports.isAuthenticated = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  next();
};

exports.tenantFilter = () => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    if (req.user.isSuperAdmin || req.user.role?.code === 'SUPER_ADMIN') {
      const schoolId = req.headers['x-school-id'] || req.query.schoolId || req.body?.school;
      if (schoolId) {
        req.tenantQuery = { school: schoolId };
        req.isSchoolMode = true;
      } else {
        req.tenantQuery = {};
        req.isSchoolMode = false;
      }
      return next();
    }
    
    req.tenantQuery = { school: req.user.school };
    
    next();
  };
};

exports.checkModuleAccess = (moduleName) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    if (req.user.isSuperAdmin || req.user.role?.code === 'SUPER_ADMIN') {
      return next();
    }
    
    try {
      const School = require('../models/School');
      const school = await School.findById(req.user.school);
      
      if (!school) {
        return res.status(403).json({ message: 'School not found' });
      }
      
      if (!school.modules.includes(moduleName)) {
        return res.status(403).json({ 
          message: `Your subscription does not include the ${moduleName} module`,
          requiredModule: moduleName
        });
      }
      
      if (school.subscription.status !== 'Active') {
        return res.status(403).json({ 
          message: 'Your subscription is not active',
          status: school.subscription.status
        });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
};
