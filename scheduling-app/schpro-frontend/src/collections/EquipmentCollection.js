import Backbone from 'backbone';
import Equipment from '../models/Equipment';

const EquipmentCollection = Backbone.Collection.extend({
  model: Equipment,
  url: '/equipment',

  // Parse API response to extract data array
  parse(response) {
    return response.data || response;
  },

  // Get only active (not deleted) equipment
  getActive() {
    return this.filter(item => !item.isDeleted());
  },

  // Get deleted equipment
  getDeleted() {
    return this.filter(item => item.isDeleted());
  },

  // Sort by name
  comparator: 'name',
});

export default EquipmentCollection;
