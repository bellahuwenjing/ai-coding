import Backbone from 'backbone';

const Person = Backbone.Model.extend({
  urlRoot: '/api/people',

  defaults: {
    name: '',
    email: '',
    role: 'member',
    phone: '',
    skills: [],
    is_deleted: false,
  },

  // Helper methods
  isAdmin() {
    return this.get('role') === 'admin';
  },

  isMember() {
    return this.get('role') === 'member';
  },

  isAssignable() {
    return this.isMember() && !this.get('is_deleted');
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
