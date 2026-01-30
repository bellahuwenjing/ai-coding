import Backbone from 'backbone';

const Equipment = Backbone.Model.extend({
  urlRoot: '/api/equipment',

  defaults: {
    name: '',
    type: '',
    serial_number: '',
    condition: 'Good',
    is_deleted: false,
  },

  // Helper methods
  isDeleted() {
    return this.get('is_deleted');
  },

  // Undelete this equipment
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

    if (!attrs.serial_number || attrs.serial_number.trim() === '') {
      errors.serial_number = 'Serial number is required';
    }

    if (Object.keys(errors).length > 0) {
      return errors;
    }
  }
});

export default Equipment;
