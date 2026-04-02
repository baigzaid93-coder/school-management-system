const setSchoolFromTenant = (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    if (req.tenantQuery?.school) {
      req.body.school = req.tenantQuery.school;
    }
  }
  next();
};

const requireTenantSchool = (req, res, next) => {
  if (!req.tenantQuery?.school && !req.user?.isSuperAdmin) {
    return res.status(400).json({ 
      message: 'School context required. Please select a school.' 
    });
  }
  next();
};

module.exports = {
  setSchoolFromTenant,
  requireTenantSchool
};
