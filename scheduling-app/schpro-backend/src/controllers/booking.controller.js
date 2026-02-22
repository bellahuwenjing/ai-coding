const { supabaseAdmin } = require('../services/supabase.service');

const BOOKING_SELECT = `*, booking_people(person_id), booking_vehicles(vehicle_id), booking_equipment(equipment_id)`;

function formatBooking({ booking_people, booking_vehicles, booking_equipment, ...booking }) {
  return {
    ...booking,
    people: (booking_people || []).map(r => r.person_id),
    vehicles: (booking_vehicles || []).map(r => r.vehicle_id),
    equipment: (booking_equipment || []).map(r => r.equipment_id),
  };
}

/**
 * Validate requirements structure
 * Returns error message if invalid, null if valid
 */
function validateRequirements(requirements) {
  if (!requirements) return null; // Requirements are optional

  if (typeof requirements !== 'object' || Array.isArray(requirements)) {
    return 'Requirements must be an object';
  }

  const { people = [], vehicles = [], equipment = [] } = requirements;

  // Validate people requirements
  if (!Array.isArray(people)) {
    return 'Requirements.people must be an array';
  }
  for (const req of people) {
    if (!req.quantity || req.quantity < 1) {
      return 'People requirement quantity must be at least 1';
    }
    if (req.skills && !Array.isArray(req.skills)) {
      return 'People requirement skills must be an array';
    }
    if (req.certifications && !Array.isArray(req.certifications)) {
      return 'People requirement certifications must be an array';
    }
  }

  // Validate vehicle requirements
  if (!Array.isArray(vehicles)) {
    return 'Requirements.vehicles must be an array';
  }
  for (const req of vehicles) {
    if (!req.quantity || req.quantity < 1) {
      return 'Vehicle requirement quantity must be at least 1';
    }
    if (req.min_capacity && typeof req.min_capacity !== 'number') {
      return 'Vehicle min_capacity must be a number';
    }
  }

  // Validate equipment requirements
  if (!Array.isArray(equipment)) {
    return 'Requirements.equipment must be an array';
  }
  for (const req of equipment) {
    if (!req.quantity || req.quantity < 1) {
      return 'Equipment requirement quantity must be at least 1';
    }
    if (req.min_condition && !['excellent', 'good', 'fair', 'poor'].includes(req.min_condition)) {
      return 'Equipment min_condition must be excellent, good, fair, or poor';
    }
  }

  return null; // Valid
}

async function insertResources(bookingId, people, vehicles, equipment) {
  const inserts = [];

  if (people?.length) {
    inserts.push(
      supabaseAdmin.from('booking_people').insert(
        people.map(personId => ({ booking_id: bookingId, person_id: personId }))
      )
    );
  }

  if (vehicles?.length) {
    inserts.push(
      supabaseAdmin.from('booking_vehicles').insert(
        vehicles.map(vehicleId => ({ booking_id: bookingId, vehicle_id: vehicleId }))
      )
    );
  }

  if (equipment?.length) {
    inserts.push(
      supabaseAdmin.from('booking_equipment').insert(
        equipment.map(equipmentId => ({ booking_id: bookingId, equipment_id: equipmentId }))
      )
    );
  }

  if (inserts.length) {
    const results = await Promise.all(inserts);
    for (const { error } of results) {
      if (error) throw error;
    }
  }
}

async function replaceResources(bookingId, people, vehicles, equipment) {
  await Promise.all([
    supabaseAdmin.from('booking_people').delete().eq('booking_id', bookingId),
    supabaseAdmin.from('booking_vehicles').delete().eq('booking_id', bookingId),
    supabaseAdmin.from('booking_equipment').delete().eq('booking_id', bookingId),
  ]);

  await insertResources(bookingId, people, vehicles, equipment);
}

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

    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select(BOOKING_SELECT)
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
      data: bookings.map(formatBooking)
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
      .select(BOOKING_SELECT)
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
      data: formatBooking(booking)
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
    const { title, location, start_time, end_time, notes, requirements, people, vehicles, equipment } = req.body;
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

    // Validate requirements if provided
    const requirementsError = validateRequirements(requirements);
    if (requirementsError) {
      return res.status(400).json({
        status: 'error',
        message: requirementsError
      });
    }

    // Create booking
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .insert({
        company_id: companyId,
        title,
        location: location || null,
        start_time,
        end_time,
        notes: notes || null,
        requirements: requirements || {}
      })
      .select()
      .single();

    if (error) {
      console.error('Create booking error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to create booking'
      });
    }

    // Persist assigned resources to junction tables
    await insertResources(booking.id, people, vehicles, equipment);

    res.status(201).json({
      status: 'success',
      message: 'Booking created successfully',
      data: {
        ...booking,
        people: people || [],
        vehicles: vehicles || [],
        equipment: equipment || [],
      }
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
    const { title, location, start_time, end_time, notes, requirements, people, vehicles, equipment } = req.body;
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

    // Validate requirements if provided
    const requirementsError = validateRequirements(requirements);
    if (requirementsError) {
      return res.status(400).json({
        status: 'error',
        message: requirementsError
      });
    }

    // Build update object - only include requirements if it's explicitly provided
    const updateData = {
      title,
      location: location || null,
      start_time,
      end_time,
      notes: notes || null,
      updated_at: new Date().toISOString()
    };

    // Only update requirements if explicitly provided (allows omitting it in updates)
    if (requirements !== undefined) {
      updateData.requirements = requirements;
    }

    // Update booking
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

    // Replace junction records with the new resource assignments
    await replaceResources(id, people, vehicles, equipment);

    res.json({
      status: 'success',
      message: 'Booking updated successfully',
      data: {
        ...booking,
        people: people || [],
        vehicles: vehicles || [],
        equipment: equipment || [],
      }
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
