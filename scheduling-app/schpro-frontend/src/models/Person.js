import Backbone from 'backbone';

const Person = Backbone.Model.extend({
  urlRoot: '/people',

  defaults: {
    name: '',
    email: '',
    phone: '',
    home_address: '',
    skills: [],
    certifications: [],
    hourly_rate: null,
    is_deleted: false,
  },

  // Helper methods
  isAdmin() {
    // For MVP: all authenticated users are admin
    return true;
  },

  isMember() {
    // For MVP: consider everyone a member
    return true;
  },

  isAssignable() {
    return !this.get('is_deleted');
  },

  isDeleted() {
    return this.get('is_deleted');
  },

  // Undelete this person
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

    if (!attrs.email || attrs.email.trim() === '') {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(attrs.email)) {
      errors.email = 'Invalid email format';
    }

    if (Object.keys(errors).length > 0) {
      return errors;
    }
  }
});

export default Person;
