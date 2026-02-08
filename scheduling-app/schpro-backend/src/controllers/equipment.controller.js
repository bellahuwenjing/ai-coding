const { supabaseAdmin } = require('../services/supabase.service');

/**
 * Get all equipment for the user's company
 * GET /api/equipment
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

    // Get all non-deleted equipment for this company
    const { data: equipment, error } = await supabaseAdmin
      .from('equipment')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get equipment error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to fetch equipment'
      });
    }

    res.json({
      status: 'success',
      data: equipment
    });

  } catch (error) {
    console.error('Get equipment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * Get single equipment by ID
 * GET /api/equipment/:id
 */
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;

    const { data: equipment, error } = await supabaseAdmin
      .from('equipment')
      .select('*')
      .eq('id', id)
      .eq('company_id', companyId)
      .eq('is_deleted', false)
      .single();

    if (error || !equipment) {
      return res.status(404).json({
        status: 'error',
        message: 'Equipment not found'
      });
    }

    res.json({
      status: 'success',
      data: equipment
    });

  } catch (error) {
    console.error('Get equipment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * Create new equipment
 * POST /api/equipment
 */
exports.create = async (req, res) => {
  try {
    const { name, serial_number, type, condition, notes } = req.body;
    const companyId = req.user.company_id;

    // Validate required fields
    if (!name || !serial_number) {
      return res.status(400).json({
        status: 'error',
        message: 'Name and serial number are required'
      });
    }

    // Validate condition if provided
    const validConditions = ['excellent', 'good', 'fair', 'poor'];
    if (condition && !validConditions.includes(condition)) {
      return res.status(400).json({
        status: 'error',
        message: `Condition must be one of: ${validConditions.join(', ')}`
      });
    }

    // Build insert object
    const insertData = {
      company_id: companyId,
      name,
      serial_number,
      type: type || null,
      condition: condition || null,
      notes: notes || null
    };

    // Create equipment
    const { data: equipment, error } = await supabaseAdmin
      .from('equipment')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Create equipment error:', error);

      // Handle duplicate serial number error
      if (error.code === '23505') {
        return res.status(400).json({
          status: 'error',
          message: 'Equipment with this serial number already exists in your company'
        });
      }

      return res.status(500).json({
        status: 'error',
        message: 'Failed to create equipment'
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'Equipment created successfully',
      data: equipment
    });

  } catch (error) {
    console.error('Create equipment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * Update equipment
 * PUT /api/equipment/:id
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, serial_number, type, condition, notes } = req.body;
    const companyId = req.user.company_id;

    // Validate required fields
    if (!name || !serial_number) {
      return res.status(400).json({
        status: 'error',
        message: 'Name and serial number are required'
      });
    }

    // Validate condition if provided
    const validConditions = ['excellent', 'good', 'fair', 'poor'];
    if (condition && !validConditions.includes(condition)) {
      return res.status(400).json({
        status: 'error',
        message: `Condition must be one of: ${validConditions.join(', ')}`
      });
    }

    // Build update object
    const updateData = {
      name,
      serial_number,
      type: type || null,
      condition: condition || null,
      notes: notes || null,
      updated_at: new Date().toISOString()
    };

    // Update equipment (only if it belongs to user's company)
    const { data: equipment, error } = await supabaseAdmin
      .from('equipment')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', companyId)
      .eq('is_deleted', false)
      .select()
      .single();

    if (error) {
      console.error('Update equipment Supabase error:', error);

      // Handle duplicate serial number error
      if (error.code === '23505') {
        return res.status(400).json({
          status: 'error',
          message: 'Equipment with this serial number already exists in your company'
        });
      }

      return res.status(500).json({
        status: 'error',
        message: 'Failed to update equipment',
        details: error.message
      });
    }

    if (!equipment) {
      console.error('Equipment not found for update:', { id, companyId });
      return res.status(404).json({
        status: 'error',
        message: 'Equipment not found or does not belong to your company'
      });
    }

    res.json({
      status: 'success',
      message: 'Equipment updated successfully',
      data: equipment
    });

  } catch (error) {
    console.error('Update equipment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * Soft delete equipment
 * DELETE /api/equipment/:id
 */
exports.softDelete = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;

    // Soft delete by setting is_deleted flag
    const { data: equipment, error } = await supabaseAdmin
      .from('equipment')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('company_id', companyId)
      .eq('is_deleted', false)
      .select()
      .single();

    if (error || !equipment) {
      return res.status(404).json({
        status: 'error',
        message: 'Equipment not found or already deleted'
      });
    }

    res.json({
      status: 'success',
      message: 'Equipment deleted successfully',
      data: equipment
    });

  } catch (error) {
    console.error('Delete equipment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * Restore deleted equipment
 * POST /api/equipment/:id/restore
 */
exports.restore = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;

    // Restore by unsetting is_deleted flag
    const { data: equipment, error } = await supabaseAdmin
      .from('equipment')
      .update({
        is_deleted: false,
        deleted_at: null
      })
      .eq('id', id)
      .eq('company_id', companyId)
      .eq('is_deleted', true)
      .select()
      .single();

    if (error || !equipment) {
      return res.status(404).json({
        status: 'error',
        message: 'Equipment not found or not deleted'
      });
    }

    res.json({
      status: 'success',
      message: 'Equipment restored successfully',
      data: equipment
    });

  } catch (error) {
    console.error('Restore equipment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};
