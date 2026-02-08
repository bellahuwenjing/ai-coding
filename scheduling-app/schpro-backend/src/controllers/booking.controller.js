const { supabaseAdmin } = require('../services/supabase.service');

/**
 * Get all bookings for the user's company
 * GET /api/bookings
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

    // Get all non-deleted bookings for this company
    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get bookings error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to fetch bookings'
      });
    }

    res.json({
      status: 'success',
      data: bookings
    });

  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * Get single booking by ID
 * GET /api/bookings/:id
 */
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', id)
      .eq('company_id', companyId)
      .eq('is_deleted', false)
      .single();

    if (error || !booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }

    res.json({
      status: 'success',
      data: booking
    });

  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * Create new booking
 * POST /api/bookings
 */
exports.create = async (req, res) => {
  try {
    const { title, location, start_time, end_time, notes } = req.body;
    const companyId = req.user.company_id;

    // Validate required fields
    if (!title || !start_time || !end_time) {
      return res.status(400).json({
        status: 'error',
        message: 'Title, start time, and end time are required'
      });
    }

    // Validate time range
    if (new Date(end_time) <= new Date(start_time)) {
      return res.status(400).json({
        status: 'error',
        message: 'End time must be after start time'
      });
    }

    // Build insert object
    const insertData = {
      company_id: companyId,
      title,
      location: location || null,
      start_time,
      end_time,
      notes: notes || null
    };

    // Create booking
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Create booking error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to create booking'
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'Booking created successfully',
      data: booking
    });

  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * Update booking
 * PUT /api/bookings/:id
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, location, start_time, end_time, notes } = req.body;
    const companyId = req.user.company_id;

    // Validate required fields
    if (!title || !start_time || !end_time) {
      return res.status(400).json({
        status: 'error',
        message: 'Title, start time, and end time are required'
      });
    }

    // Validate time range
    if (new Date(end_time) <= new Date(start_time)) {
      return res.status(400).json({
        status: 'error',
        message: 'End time must be after start time'
      });
    }

    // Build update object
    const updateData = {
      title,
      location: location || null,
      start_time,
      end_time,
      notes: notes || null,
      updated_at: new Date().toISOString()
    };

    // Update booking (only if it belongs to user's company)
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', companyId)
      .eq('is_deleted', false)
      .select()
      .single();

    if (error) {
      console.error('Update booking Supabase error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to update booking',
        details: error.message
      });
    }

    if (!booking) {
      console.error('Booking not found for update:', { id, companyId });
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found or does not belong to your company'
      });
    }

    res.json({
      status: 'success',
      message: 'Booking updated successfully',
      data: booking
    });

  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * Soft delete booking
 * DELETE /api/bookings/:id
 */
exports.softDelete = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;

    // Soft delete by setting is_deleted flag
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('company_id', companyId)
      .eq('is_deleted', false)
      .select()
      .single();

    if (error || !booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found or already deleted'
      });
    }

    res.json({
      status: 'success',
      message: 'Booking deleted successfully',
      data: booking
    });

  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * Restore deleted booking
 * POST /api/bookings/:id/restore
 */
exports.restore = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;

    // Restore by unsetting is_deleted flag
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .update({
        is_deleted: false,
        deleted_at: null
      })
      .eq('id', id)
      .eq('company_id', companyId)
      .eq('is_deleted', true)
      .select()
      .single();

    if (error || !booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found or not deleted'
      });
    }

    res.json({
      status: 'success',
      message: 'Booking restored successfully',
      data: booking
    });

  } catch (error) {
    console.error('Restore booking error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};
