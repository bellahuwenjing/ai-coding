import Backbone from 'backbone';
import Vehicle from '../models/Vehicle';

const VehiclesCollection = Backbone.Collection.extend({
  model: Vehicle,
  url: '/vehicles',

  // Parse API response to extract data array
  parse(response) {
    return response.data || response;
  },

  // Get only active (not deleted) vehicles
  getActive() {
    return this.filter(vehicle => !vehicle.isDeleted());
  },

  // Get deleted vehicles
  getDeleted() {
    return this.filter(vehicle => vehicle.isDeleted());
  },

  // Sort by name
  comparator: 'name',
});

export default VehiclesCollection;
