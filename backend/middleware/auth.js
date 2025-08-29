const { ClerkExpressWithAuth } = require('@clerk/clerk-sdk-node');

const requireAuth = ClerkExpressWithAuth();

const requireAdmin = async (req, res, next) => {
  if (!req.auth.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const user = await req.auth.getUser();
    if (user.publicMetadata?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid authentication' });
  }
};

module.exports = { requireAuth, requireAdmin };
