import Backbone from 'backbone';
import Booking from '../models/Booking';

const BookingsCollection = Backbone.Collection.extend({
  model: Booking,
  url: '/api/bookings',

  // Get only active (not deleted) bookings
  getActive() {
    return this.filter(booking => !booking.isDeleted());
  },

  // Get deleted bookings
  getDeleted() {
    return this.filter(booking => booking.isDeleted());
  },

  // Filter by date range
  getByDateRange(startDate, endDate) {
    return this.filter(booking => {
      const bookingStart = new Date(booking.get('start_time'));
      const bookingEnd = new Date(booking.get('end_time'));
      const rangeStart = new Date(startDate);
      const rangeEnd = new Date(endDate);

      // Check if booking overlaps with date range
      return bookingStart <= rangeEnd && bookingEnd >= rangeStart;
    });
  },

  // Filter by person ID
  getByPerson(personId) {
    return this.filter(booking => {
      const people = booking.get('people') || [];
      return people.includes(personId);
    });
  },

  // Filter by vehicle ID
  getByVehicle(vehicleId) {
    return this.filter(booking => {
      const vehicles = booking.get('vehicles') || [];
      return vehicles.includes(vehicleId);
    });
  },

  // Filter by equipment ID
  getByEquipment(equipmentId) {
    return this.filter(booking => {
      const equipment = booking.get('equipment') || [];
      return equipment.includes(equipmentId);
    });
  },

  // Sort by start time (most recent first)
  comparator: function(booking) {
    return -new Date(booking.get('start_time')).getTime();
  },
});

export default BookingsCollection;
