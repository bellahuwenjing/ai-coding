import Backbone from 'backbone'
import { supabase } from '../config/supabase'

const Person = Backbone.Model.extend({
  defaults: {
    id: null,
    company_id: null,
    user_id: null,
    name: '',
    email: '',
    phone: '',
    skills: [],
    certifications: [],
    hourly_rate: null,
    is_deleted: false,
    created_at: null,
    updated_at: null,
  },

  // Override sync to use Supabase
  sync(method, model, options) {
    const handleResponse = (data, error) => {
      if (error) {
        console.error('Supabase error:', error)
        if (options.error) options.error(model, error)
        return Promise.reject(error)
      }
      if (options.success) options.success(data)
      return Promise.resolve(data)
    }

    switch (method) {
      case 'read':
        return supabase
          .from('people')
          .select('*')
          .eq('id', model.id)
          .single()
          .then(({ data, error }) => handleResponse(data, error))

      case 'create':
        return supabase
          .from('people')
          .insert(model.toJSON())
          .select()
          .single()
          .then(({ data, error }) => handleResponse(data, error))

      case 'update':
        return supabase
          .from('people')
          .update(model.toJSON())
          .eq('id', model.id)
          .select()
          .single()
          .then(({ data, error }) => handleResponse(data, error))

      case 'delete':
        // Soft delete
        return supabase
          .from('people')
          .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
          })
          .eq('id', model.id)
          .then(({ error }) => handleResponse({}, error))

      default:
        return Promise.reject(new Error(`Unknown method: ${method}`))
    }
  },

  // Helper methods
  isAdmin() {
    return this.get('role') === 'admin'
  },

  isMember() {
    return this.get('role') === 'member'
  },

  isAssignable() {
    return !this.get('is_deleted')
  },

  isDeleted() {
    return this.get('is_deleted')
  },

  // Undelete this person
  async undelete() {
    const { data, error } = await supabase
      .from('people')
      .update({
        is_deleted: false,
        deleted_at: null,
      })
      .eq('id', this.id)
      .select()
      .single()

    if (error) throw error
    this.set(data)
    return this
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
