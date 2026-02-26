const { supabaseAdmin } = require('../services/supabase.service');

/**
 * Get all people for the user's company
 * GET /api/people
 */
exports.getAll = async (req, res) => {
  try {
    const companyId = req.user.company_id;

    if (!companyId) {
      return res.status(400).json({
        status: 'error',
        message: 'Company ID not found. Please login again.'
      });
    }

    // Get all non-deleted people for this company
    const { data: people, error } = await supabaseAdmin
      .from('people')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get people error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to fetch people'
      });
    }

    res.json({
      status: 'success',
      data: people
    });

  } catch (error) {
    console.error('Get people error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * Get single person by ID
 * GET /api/people/:id
 */
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;

    const { data: person, error } = await supabaseAdmin
      .from('people')
      .select('*')
      .eq('id', id)
      .eq('company_id', companyId)
      .eq('is_deleted', false)
      .single();

    if (error || !person) {
      return res.status(404).json({
        status: 'error',
        message: 'Person not found'
      });
    }

    res.json({
      status: 'success',
      data: person
    });

  } catch (error) {
    console.error('Get person error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * Create new person
 * POST /api/people
 */
exports.create = async (req, res) => {
  try {
    const { name, email, phone, home_address, skills, certifications, hourly_rate } = req.body;
    const companyId = req.user.company_id;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({
        status: 'error',
        message: 'Name and email are required'
      });
    }

    // Build insert object (only fields that exist in database)
    const insertData = {
      company_id: companyId,
      name,
      email,
      phone: phone || null,
      home_address: home_address || null,
      skills: skills || [],
      certifications: certifications || [],
      hourly_rate: hourly_rate || null
    };

    // Create person
    const { data: person, error } = await supabaseAdmin
      .from('people')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Create person error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to create person'
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'Person created successfully',
      data: person
    });

  } catch (error) {
    console.error('Create person error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * Update person
 * PUT /api/people/:id
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, home_address, skills, certifications, hourly_rate } = req.body;
    const companyId = req.user.company_id;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({
        status: 'error',
        message: 'Name and email are required'
      });
    }

    // Build update object (only fields that exist in database)
    const updateData = {
      name,
      email,
      phone: phone || null,
      home_address: home_address || null,
      updated_at: new Date().toISOString()
    };

    // Add optional fields if provided
    if (skills !== undefined) updateData.skills = skills;
    if (certifications !== undefined) updateData.certifications = certifications;
    if (hourly_rate !== undefined) updateData.hourly_rate = hourly_rate;

    // Update person (only if it belongs to user's company)
    const { data: person, error } = await supabaseAdmin
      .from('people')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', companyId)
      .eq('is_deleted', false)
      .select()
      .single();

    if (error) {
      console.error('Update person Supabase error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to update person',
        details: error.message
      });
    }

    if (!person) {
      console.error('Person not found for update:', { id, companyId });
      return res.status(404).json({
        status: 'error',
        message: 'Person not found or does not belong to your company'
      });
    }

    res.json({
      status: 'success',
      message: 'Person updated successfully',
      data: person
    });

  } catch (error) {
    console.error('Update person error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * Soft delete person
 * DELETE /api/people/:id
 */
exports.softDelete = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;

    // Soft delete by setting is_deleted flag
    const { data: person, error } = await supabaseAdmin
      .from('people')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('company_id', companyId)
      .eq('is_deleted', false)
      .select()
      .single();

    if (error || !person) {
      return res.status(404).json({
        status: 'error',
        message: 'Person not found or already deleted'
      });
    }

    res.json({
      status: 'success',
      message: 'Person deleted successfully',
      data: person
    });

  } catch (error) {
    console.error('Delete person error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * Restore deleted person
 * POST /api/people/:id/restore
 */
exports.restore = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;

    // Restore by unsetting is_deleted flag
    const { data: person, error } = await supabaseAdmin
      .from('people')
      .update({
        is_deleted: false,
        deleted_at: null
      })
      .eq('id', id)
      .eq('company_id', companyId)
      .eq('is_deleted', true)
      .select()
      .single();

    if (error || !person) {
      return res.status(404).json({
        status: 'error',
        message: 'Person not found or not deleted'
      });
    }

    res.json({
      status: 'success',
      message: 'Person restored successfully',
      data: person
    });

  } catch (error) {
    console.error('Restore person error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};
