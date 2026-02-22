import Backbone from 'backbone';

const Booking = Backbone.Model.extend({
  urlRoot: '/bookings',

  defaults: {
    title: '',
    location: '',
    start_time: '',
    end_time: '',
    notes: '',
    people: [],      // Array of person IDs
    vehicles: [],    // Array of vehicle IDs
    equipment: [],   // Array of equipment IDs
    requirements: {  // Resource requirements for AI scheduling
      people: [],    // [{ role, skills, certifications, quantity }]
      vehicles: [],  // [{ type, min_capacity, quantity }]
      equipment: []  // [{ type, min_condition, quantity }]
    },
    is_deleted: false,
  },

  // Helper methods
  isDeleted() {
    return this.get('is_deleted');
  },

  // Undelete this booking
  undelete() {
    const url = `${this.urlRoot}/${this.id}/restore`;
    return Backbone.sync('create', this, {
      url: url,
      success: (data) => {
        this.set(data);
      }
    });
  },

  // Check if booking has any assigned resources
  hasResources() {
    const people = this.get('people') || [];
    const vehicles = this.get('vehicles') || [];
    const equipment = this.get('equipment') || [];
    return people.length > 0 || vehicles.length > 0 || equipment.length > 0;
  },

  // Get resource counts
  getResourceCounts() {
    return {
      people: (this.get('people') || []).length,
      vehicles: (this.get('vehicles') || []).length,
      equipment: (this.get('equipment') || []).length,
    };
  },

  // Validation
  validate(attrs) {
    const errors = {};

    if (!attrs.title || attrs.title.trim() === '') {
      errors.title = 'Title is required';
    }

    if (!attrs.start_time) {
      errors.start_time = 'Start time is required';
    }

    if (!attrs.end_time) {
      errors.end_time = 'End time is required';
    }

    // Validate end time is after start time
    if (attrs.start_time && attrs.end_time) {
      const start = new Date(attrs.start_time);
      const end = new Date(attrs.end_time);
      if (end <= start) {
        errors.end_time = 'End time must be after start time';
      }
    }

    // At least one resource must be assigned
    const people = attrs.people || [];
    const vehicles = attrs.vehicles || [];
    const equipment = attrs.equipment || [];
    if (people.length === 0 && vehicles.length === 0 && equipment.length === 0) {
      errors.resources = 'At least one person, vehicle, or equipment must be assigned';
    }

    // Validate requirements if present
    if (attrs.requirements) {
      const { people: peopleReqs = [], vehicles: vehicleReqs = [], equipment: equipmentReqs = [] } = attrs.requirements;

      // Validate people requirements
      peopleReqs.forEach((req, idx) => {
        if (!req.quantity || req.quantity < 1) {
          errors[`requirements.people.${idx}.quantity`] = 'Quantity must be at least 1';
        }
      });

      // Validate vehicle requirements
      vehicleReqs.forEach((req, idx) => {
        if (!req.quantity || req.quantity < 1) {
          errors[`requirements.vehicles.${idx}.quantity`] = 'Quantity must be at least 1';
        }
      });

      // Validate equipment requirements
      equipmentReqs.forEach((req, idx) => {
        if (!req.quantity || req.quantity < 1) {
          errors[`requirements.equipment.${idx}.quantity`] = 'Quantity must be at least 1';
        }
        if (req.min_condition && !['excellent', 'good', 'fair', 'poor'].includes(req.min_condition)) {
          errors[`requirements.equipment.${idx}.min_condition`] = 'Condition must be excellent, good, fair, or poor';
        }
      });
    }

    if (Object.keys(errors).length > 0) {
      return errors;
    }
  }
});

export default Booking;
