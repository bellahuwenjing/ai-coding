const { supabaseAuth, supabaseAdmin } = require('../services/supabase.service');

/**
 * Register new company and admin user
 * POST /api/auth/register
 */
exports.register = async (req, res) => {
  try {
    const { company_name, name, email, password } = req.body;

    // Validate required fields
    if (!company_name || !name || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: company_name, name, email, password'
      });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 8 characters'
      });
    }

    // 1. Create user in Supabase Auth (use ANON_KEY client)
    const { data: authData, error: authError } = await supabaseAuth.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name
        }
      }
    });

    if (authError) {
      console.error('Auth signup error:', authError);
      return res.status(400).json({
        status: 'error',
        message: authError.message || 'Failed to create user account'
      });
    }

    const userId = authData.user.id;

    // 2. Create company (use SERVICE_ROLE_KEY client to bypass RLS)
    const companySlug = company_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert({
        name: company_name,
        slug: companySlug,
        settings: {}
      })
      .select()
      .single();

    if (companyError) {
      console.error('Company creation error:', companyError);
      // TODO: Rollback auth user creation
      return res.status(500).json({
        status: 'error',
        message: 'Failed to create company'
      });
    }

    // 3. Create person record (links user to company, use SERVICE_ROLE_KEY)
    const { data: person, error: personError } = await supabaseAdmin
      .from('people')
      .insert({
        company_id: company.id,
        user_id: userId,
        name,
        email
      })
      .select()
      .single();

    if (personError) {
      console.error('Person creation error:', personError);
      // TODO: Rollback company and auth user
      return res.status(500).json({
        status: 'error',
        message: 'Failed to create user profile'
      });
    }

    // 4. Return success with session tokens
    res.status(201).json({
      status: 'success',
      message: 'Registration successful',
      data: {
        user: {
          id: userId,
          email: authData.user.email
        },
        session: {
          access_token: authData.session?.access_token,
          refresh_token: authData.session?.refresh_token
        },
        profile: {
          id: person.id,
          name: person.name,
          company_id: company.id,
          company_name: company.name
        }
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during registration'
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required'
      });
    }

    // 1. Sign in with Supabase Auth (use ANON_KEY client)
    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('Login error:', authError);
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    const userId = authData.user.id;

    // 2. Get person record (includes company_id, use SERVICE_ROLE_KEY)
    const { data: person, error: personError } = await supabaseAdmin
      .from('people')
      .select('id, name, email, company_id, companies(name)')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .single();

    if (personError || !person) {
      console.error('Person lookup error:', personError);
      return res.status(404).json({
        status: 'error',
        message: 'User profile not found'
      });
    }

    // 3. Return success with session and profile
    res.json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: userId,
          email: authData.user.email
        },
        session: {
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token
        },
        profile: {
          id: person.id,
          name: person.name,
          email: person.email,
          company_id: person.company_id,
          company_name: person.companies.name
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during login'
    });
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
exports.logout = async (req, res) => {
  try {
    // Get token from Authorization header
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'No token provided'
      });
    }

    // Sign out from Supabase (invalidates the token, use ANON_KEY client)
    const { error } = await supabaseAuth.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to logout'
      });
    }

    res.json({
      status: 'success',
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during logout'
    });
  }
};

/**
 * Get current user
 * GET /api/auth/me
 */
exports.getCurrentUser = async (req, res) => {
  try {
    // User info is attached by auth middleware
    const userId = req.user.id;

    // Get person record with company info (use SERVICE_ROLE_KEY)
    const { data: person, error: personError } = await supabaseAdmin
      .from('people')
      .select('id, name, email, phone, company_id, companies(id, name, slug)')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .single();

    if (personError || !person) {
      console.error('Person lookup error:', personError);
      return res.status(404).json({
        status: 'error',
        message: 'User profile not found'
      });
    }

    res.json({
      status: 'success',
      data: {
        id: person.id,
        name: person.name,
        email: person.email,
        phone: person.phone,
        company: {
          id: person.companies.id,
          name: person.companies.name,
          slug: person.companies.slug
        }
      }
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};
