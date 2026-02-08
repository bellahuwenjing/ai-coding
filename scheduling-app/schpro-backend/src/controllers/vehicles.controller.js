const { supabaseAdmin } = require('../services/supabase.service');

/**
 * Get all vehicles for the user's company
 * GET /api/vehicles
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

    // Get all non-deleted vehicles for this company
    const { data: vehicles, error } = await supabaseAdmin
      .from('vehicles')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get vehicles error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to fetch vehicles'
      });
    }

    res.json({
      status: 'success',
      data: vehicles
    });

  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * Get single vehicle by ID
 * GET /api/vehicles/:id
 */
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;

    const { data: vehicle, error } = await supabaseAdmin
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .eq('company_id', companyId)
      .eq('is_deleted', false)
      .single();

    if (error || !vehicle) {
      return res.status(404).json({
        status: 'error',
        message: 'Vehicle not found'
      });
    }

    res.json({
      status: 'success',
      data: vehicle
    });

  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * Create new vehicle
 * POST /api/vehicles
 */
exports.create = async (req, res) => {
  try {
    const { name, license_plate, make, model, year, capacity, notes } = req.body;
    const companyId = req.user.company_id;

    // Validate required fields
    if (!name || !license_plate) {
      return res.status(400).json({
        status: 'error',
        message: 'Name and license plate are required'
      });
    }

    // Build insert object
    const insertData = {
      company_id: companyId,
      name,
      license_plate,
      make: make || null,
      model: model || null,
      year: year || null,
      capacity: capacity || null,
      notes: notes || null
    };

    // Create vehicle
    const { data: vehicle, error } = await supabaseAdmin
      .from('vehicles')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Create vehicle error:', error);

      // Handle duplicate license plate error
      if (error.code === '23505') {
        return res.status(400).json({
          status: 'error',
          message: 'A vehicle with this license plate already exists in your company'
        });
      }

      return res.status(500).json({
        status: 'error',
        message: 'Failed to create vehicle'
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'Vehicle created successfully',
      data: vehicle
    });

  } catch (error) {
    console.error('Create vehicle error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * Update vehicle
 * PUT /api/vehicles/:id
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, license_plate, make, model, year, capacity, notes } = req.body;
    const companyId = req.user.company_id;

    // Validate required fields
    if (!name || !license_plate) {
      return res.status(400).json({
        status: 'error',
        message: 'Name and license plate are required'
      });
    }

    // Build update object
    const updateData = {
      name,
      license_plate,
      make: make || null,
      model: model || null,
      year: year || null,
      capacity: capacity || null,
      notes: notes || null,
      updated_at: new Date().toISOString()
    };

    // Update vehicle (only if it belongs to user's company)
    const { data: vehicle, error } = await supabaseAdmin
      .from('vehicles')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', companyId)
      .eq('is_deleted', false)
      .select()
      .single();

    if (error) {
      console.error('Update vehicle Supabase error:', error);

      // Handle duplicate license plate error
      if (error.code === '23505') {
        return res.status(400).json({
          status: 'error',
          message: 'A vehicle with this license plate already exists in your company'
        });
      }

      return res.status(500).json({
        status: 'error',
        message: 'Failed to update vehicle',
        details: error.message
      });
    }

    if (!vehicle) {
      console.error('Vehicle not found for update:', { id, companyId });
      return res.status(404).json({
        status: 'error',
        message: 'Vehicle not found or does not belong to your company'
      });
    }

    res.json({
      status: 'success',
      message: 'Vehicle updated successfully',
      data: vehicle
    });

  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * Soft delete vehicle
 * DELETE /api/vehicles/:id
 */
exports.softDelete = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;

    // Soft delete by setting is_deleted flag
    const { data: vehicle, error } = await supabaseAdmin
      .from('vehicles')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('company_id', companyId)
      .eq('is_deleted', false)
      .select()
      .single();

    if (error || !vehicle) {
      return res.status(404).json({
        status: 'error',
        message: 'Vehicle not found or already deleted'
      });
    }

    res.json({
      status: 'success',
      message: 'Vehicle deleted successfully',
      data: vehicle
    });

  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * Restore deleted vehicle
 * POST /api/vehicles/:id/restore
 */
exports.restore = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;

    // Restore by unsetting is_deleted flag
    const { data: vehicle, error } = await supabaseAdmin
      .from('vehicles')
      .update({
        is_deleted: false,
        deleted_at: null
      })
      .eq('id', id)
      .eq('company_id', companyId)
      .eq('is_deleted', true)
      .select()
      .single();

    if (error || !vehicle) {
      return res.status(404).json({
        status: 'error',
        message: 'Vehicle not found or not deleted'
      });
    }

    res.json({
      status: 'success',
      message: 'Vehicle restored successfully',
      data: vehicle
    });

  } catch (error) {
    console.error('Restore vehicle error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};
