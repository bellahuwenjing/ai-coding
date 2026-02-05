const supabase = require('../services/supabase.service');

/**
 * Middleware to verify Supabase JWT token
 * Attaches user info to req.user
 */
const verifyToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'No token provided. Please login.'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid or expired token. Please login again.'
      });
    }

    // Attach user to request object
    req.user = user;

    // Get person record to attach company_id (useful for queries)
    const { data: person } = await supabase
      .from('people')
      .select('id, company_id')
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .single();

    if (person) {
      req.user.person_id = person.id;
      req.user.company_id = person.company_id;
    }

    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Authentication error'
    });
  }
};

module.exports = { verifyToken };
