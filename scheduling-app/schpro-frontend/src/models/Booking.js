import Backbone from 'backbone'
import { supabase } from '../config/supabase'

const Booking = Backbone.Model.extend({
  defaults: {
    id: null,
    company_id: null,
    created_by: null,
    title: '',
    location: '',
    start_time: '',
    end_time: '',
    notes: '',
    people: [],      // Array of person IDs
    vehicles: [],    // Array of vehicle IDs
    equipment: [],   // Array of equipment IDs
    is_deleted: false,
    created_at: null,
    updated_at: null,
  },

  // Override sync to use Supabase with junction tables
  async sync(method, model, options) {
    try {
      let result

      switch (method) {
        case 'read':
          result = await this._fetchWithRelations()
          break
        case 'create':
          result = await this._createWithRelations()
          break
        case 'update':
          result = await this._updateWithRelations()
          break
        case 'delete':
          result = await this._softDelete()
          break
        default:
          throw new Error(`Unknown method: ${method}`)
      }

      if (options.success) options.success(result)
      return result
    } catch (error) {
      console.error('Booking sync error:', error)
      if (options.error) options.error(model, error)
      throw error
    }
  },

  // Fetch booking with related entities
  async _fetchWithRelations() {
    // Fetch booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', this.id)
      .single()

    if (bookingError) throw bookingError

    // Fetch related people IDs
    const { data: bookingPeople } = await supabase
      .from('booking_people')
      .select('person_id')
      .eq('booking_id', this.id)

    // Fetch related vehicle IDs
    const { data: bookingVehicles } = await supabase
      .from('booking_vehicles')
      .select('vehicle_id')
      .eq('booking_id', this.id)

    // Fetch related equipment IDs
    const { data: bookingEquipment } = await supabase
      .from('booking_equipment')
      .select('equipment_id')
      .eq('booking_id', this.id)

    // Combine into single object
    return {
      ...booking,
      people: (bookingPeople || []).map(bp => bp.person_id),
      vehicles: (bookingVehicles || []).map(bv => bv.vehicle_id),
      equipment: (bookingEquipment || []).map(be => be.equipment_id),
    }
  },

  // Create booking with junction table entries
  async _createWithRelations() {
    const attrs = this.toJSON()

    // Extract arrays before inserting booking
    const { people, vehicles, equipment, id, ...bookingData } = attrs

    // Filter out null/undefined values
    const insertData = Object.fromEntries(
      Object.entries(bookingData).filter(([_, value]) =>
        value !== null && value !== undefined
      )
    )

    // Insert booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert(insertData)
      .select()
      .single()

    if (bookingError) throw bookingError

    // Insert junction table entries
    await this._insertJunctions(booking.id, people, vehicles, equipment)

    return {
      ...booking,
      people: people || [],
      vehicles: vehicles || [],
      equipment: equipment || [],
    }
  },

  // Update booking and sync junction tables
  async _updateWithRelations() {
    const attrs = this.toJSON()
    const { people, vehicles, equipment, ...bookingData } = attrs

    // Update booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .update(bookingData)
      .eq('id', this.id)
      .select()
      .single()

    if (bookingError) throw bookingError

    // Sync junction tables (delete old, insert new)
    await this._deleteJunctions(this.id)
    await this._insertJunctions(this.id, people, vehicles, equipment)

    return {
      ...booking,
      people: people || [],
      vehicles: vehicles || [],
      equipment: equipment || [],
    }
  },

  // Insert junction table entries
  async _insertJunctions(bookingId, people = [], vehicles = [], equipment = []) {
    const promises = []

    // Insert people associations
    if (people.length > 0) {
      const peopleData = people.map(personId => ({
        booking_id: bookingId,
        person_id: personId,
      }))
      promises.push(supabase.from('booking_people').insert(peopleData))
    }

    // Insert vehicle associations
    if (vehicles.length > 0) {
      const vehiclesData = vehicles.map(vehicleId => ({
        booking_id: bookingId,
        vehicle_id: vehicleId,
      }))
      promises.push(supabase.from('booking_vehicles').insert(vehiclesData))
    }

    // Insert equipment associations
    if (equipment.length > 0) {
      const equipmentData = equipment.map(equipmentId => ({
        booking_id: bookingId,
        equipment_id: equipmentId,
      }))
      promises.push(supabase.from('booking_equipment').insert(equipmentData))
    }

    await Promise.all(promises)
  },

  // Delete all junction table entries for this booking
  async _deleteJunctions(bookingId) {
    const promises = [
      supabase.from('booking_people').delete().eq('booking_id', bookingId),
      supabase.from('booking_vehicles').delete().eq('booking_id', bookingId),
      supabase.from('booking_equipment').delete().eq('booking_id', bookingId),
    ]

    await Promise.all(promises)
  },

  // Soft delete
  async _softDelete() {
    const { error } = await supabase
      .from('bookings')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', this.id)

    if (error) throw error
    return {}
  },

  // Helper methods
  isDeleted() {
    return this.get('is_deleted')
  },

  // Undelete this booking
  async undelete() {
    const { data, error } = await supabase
      .from('bookings')
      .update({
        is_deleted: false,
        deleted_at: null,
      })
      .eq('id', this.id)
      .select()
      .single()

    if (error) throw error

    // Fetch relations
    const fullBooking = await this._fetchWithRelations()
    this.set(fullBooking)
    return this
  },

  // Check if booking has any assigned resources
  hasResources() {
    const people = this.get('people') || []
    const vehicles = this.get('vehicles') || []
    const equipment = this.get('equipment') || []
    return people.length > 0 || vehicles.length > 0 || equipment.length > 0
  },

  // Get resource counts
  getResourceCounts() {
    return {
      people: (this.get('people') || []).length,
      vehicles: (this.get('vehicles') || []).length,
      equipment: (this.get('equipment') || []).length,
    }
  },

  // Validation
  validate(attrs) {
    const errors = {}

    if (!attrs.title || attrs.title.trim() === '') {
      errors.title = 'Title is required'
    }

    if (!attrs.start_time) {
      errors.start_time = 'Start time is required'
    }

    if (!attrs.end_time) {
      errors.end_time = 'End time is required'
    }

    // Validate end time is after start time
    if (attrs.start_time && attrs.end_time) {
      const start = new Date(attrs.start_time)
      const end = new Date(attrs.end_time)
      if (end <= start) {
        errors.end_time = 'End time must be after start time'
      }
    }

    // At least one resource must be assigned
    const people = attrs.people || []
    const vehicles = attrs.vehicles || []
    const equipment = attrs.equipment || []
    if (people.length === 0 && vehicles.length === 0 && equipment.length === 0) {
      errors.resources = 'At least one person, vehicle, or equipment must be assigned'
    }

    if (Object.keys(errors).length > 0) {
      return errors
    }
  }
})

export default Booking
