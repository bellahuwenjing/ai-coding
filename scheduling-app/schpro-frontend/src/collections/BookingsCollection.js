import Backbone from 'backbone'
import Booking from '../models/Booking'
import { supabase } from '../config/supabase'

const BookingsCollection = Backbone.Collection.extend({
  model: Booking,

  // Override fetch to use Supabase with junction tables
  async fetch(options = {}) {
    const includeDeleted = options.includeDeleted || false

    try {
      // Fetch all bookings
      let query = supabase
        .from('bookings')
        .select('*')
        .order('start_time', { ascending: false })

      if (!includeDeleted) {
        query = query.eq('is_deleted', false)
      }

      const { data: bookings, error: bookingsError } = await query

      if (bookingsError) throw bookingsError

      // Fetch all junction table data
      const bookingIds = bookings.map(b => b.id)

      const [peopleResult, vehiclesResult, equipmentResult] = await Promise.all([
        supabase.from('booking_people').select('*').in('booking_id', bookingIds),
        supabase.from('booking_vehicles').select('*').in('booking_id', bookingIds),
        supabase.from('booking_equipment').select('*').in('booking_id', bookingIds),
      ])

      // Build lookup maps
      const peopleMap = {}
      const vehiclesMap = {}
      const equipmentMap = {}

      peopleResult.data?.forEach(bp => {
        if (!peopleMap[bp.booking_id]) peopleMap[bp.booking_id] = []
        peopleMap[bp.booking_id].push(bp.person_id)
      })

      vehiclesResult.data?.forEach(bv => {
        if (!vehiclesMap[bv.booking_id]) vehiclesMap[bv.booking_id] = []
        vehiclesMap[bv.booking_id].push(bv.vehicle_id)
      })

      equipmentResult.data?.forEach(be => {
        if (!equipmentMap[be.booking_id]) equipmentMap[be.booking_id] = []
        equipmentMap[be.booking_id].push(be.equipment_id)
      })

      // Combine bookings with their relations
      const fullBookings = bookings.map(booking => ({
        ...booking,
        people: peopleMap[booking.id] || [],
        vehicles: vehiclesMap[booking.id] || [],
        equipment: equipmentMap[booking.id] || [],
      }))

      this.reset(fullBookings)
      if (options.success) options.success(fullBookings)
      this.trigger('sync', this, fullBookings, options)
      return fullBookings
    } catch (error) {
      console.error('Fetch bookings error:', error)
      if (options.error) options.error(this, error)
      throw error
    }
  },

  // Get only active (not deleted) bookings
  getActive() {
    return this.filter(booking => !booking.isDeleted())
  },

  // Get deleted bookings
  getDeleted() {
    return this.filter(booking => booking.isDeleted())
  },

  // Filter by date range
  getByDateRange(startDate, endDate) {
    return this.filter(booking => {
      const bookingStart = new Date(booking.get('start_time'))
      const bookingEnd = new Date(booking.get('end_time'))
      const rangeStart = new Date(startDate)
      const rangeEnd = new Date(endDate)

      // Check if booking overlaps with date range
      return bookingStart <= rangeEnd && bookingEnd >= rangeStart
    })
  },

  // Filter by person ID
  getByPerson(personId) {
    return this.filter(booking => {
      const people = booking.get('people') || []
      return people.includes(personId)
    })
  },

  // Filter by vehicle ID
  getByVehicle(vehicleId) {
    return this.filter(booking => {
      const vehicles = booking.get('vehicles') || []
      return vehicles.includes(vehicleId)
    })
  },

  // Filter by equipment ID
  getByEquipment(equipmentId) {
    return this.filter(booking => {
      const equipment = booking.get('equipment') || []
      return equipment.includes(equipmentId)
    })
  },

  // Sort by start time (most recent first)
  comparator: function(booking) {
    return -new Date(booking.get('start_time')).getTime()
  },
})

export default BookingsCollection
