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
const validateUserOwnership = (req, res, next) => {
  try {
    // Get the authenticated user ID from Clerk
    console.log('🔍 MIDDLEWARE DEBUG - validateUserOwnership called');
    console.log('📍 Route:', req.method, req.originalUrl);
    console.log('📝 Request params:', req.params);
    console.log('🔐 Auth object:', req.auth);
    const authenticatedUserId = req.auth?.userId;
    
    // Get the requested user ID from URL parameters
    const requestedUserId = req.params.userId || req.params.customerId;
    console.log('👤 Requested User ID:', requestedUserId);
    console.log('🔑 Authenticated User ID:', authenticatedUserId);
    
    
    console.log('🔐 Validating user ownership:');
    console.log('   Authenticated User ID:', authenticatedUserId);
    console.log('   Requested User ID:', requestedUserId);
    
    // Check if user is authenticated
    if (!authenticatedUserId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required - please sign in'
      });
    }
    
    // Check if requested user ID exists
    if (!requestedUserId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required in the request'
      });
    }
    
    // Check if the authenticated user matches the requested user
    if (authenticatedUserId !== requestedUserId) {
      console.log('❌ Access denied: User ID mismatch');
       console.log('❌ USER ID MISMATCH - BLOCKING REQUEST');
      console.log(`   Authenticated: "${authenticatedUserId}"`);
      console.log(`   Requested: "${requestedUserId}"`);
      return res.status(403).json({
        success: false,
        error: 'Access denied: You can only access your own data'
      });
    }
    
    console.log('✅ User ownership validation passed');
    next(); // Allow the request to continue
    
  } catch (error) {
    console.error('❌ Error in user ownership validation:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during authentication'
    });
  }
};

// COMBINED MIDDLEWARE: Require auth AND validate ownership
const requireAuthAndOwnership = [requireAuth, validateUserOwnership];

module.exports = { 
  requireAuth, 
  requireAdmin, 
  validateUserOwnership,
  requireAuthAndOwnership 
};


