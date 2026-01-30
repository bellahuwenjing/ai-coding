import Backbone from 'backbone';

const Vehicle = Backbone.Model.extend({
  urlRoot: '/api/vehicles',

  defaults: {
    name: '',
    type: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    license_plate: '',
    capacity: 1,
    is_deleted: false,
  },

  // Helper methods
  isDeleted() {
    return this.get('is_deleted');
  },

  // Undelete this vehicle
  undelete() {
    const url = `${this.urlRoot}/${this.id}/restore`;
    return Backbone.sync('create', this, {
      url: url,
      success: (data) => {
        this.set(data);
      }
    });
  },

  // Validation
  validate(attrs) {
    const errors = {};

    if (!attrs.name || attrs.name.trim() === '') {
      errors.name = 'Name is required';
    }

    if (!attrs.license_plate || attrs.license_plate.trim() === '') {
      errors.license_plate = 'License plate is required';
    }

    if (Object.keys(errors).length > 0) {
      return errors;
    }
  }
});

export default Vehicle;
