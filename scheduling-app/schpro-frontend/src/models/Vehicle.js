import Backbone from 'backbone'
import { supabase } from '../config/supabase'

const Vehicle = Backbone.Model.extend({
  defaults: {
    id: null,
    company_id: null,
    name: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    license_plate: '',
    vin: '',
    capacity: '',
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
          .from('vehicles')
          .select('*')
          .eq('id', model.id)
          .single()
          .then(({ data, error }) => handleResponse(data, error))

      case 'create':
        // Filter out null/undefined values and id for insert
        const insertData = Object.fromEntries(
          Object.entries(model.toJSON()).filter(([key, value]) =>
            key !== 'id' && value !== null && value !== undefined
          )
        )
        return supabase
          .from('vehicles')
          .insert(insertData)
          .select()
          .single()
          .then(({ data, error }) => handleResponse(data, error))

      case 'update':
        return supabase
          .from('vehicles')
          .update(model.toJSON())
          .eq('id', model.id)
          .select()
          .single()
          .then(({ data, error }) => handleResponse(data, error))

      case 'delete':
        // Soft delete
        return supabase
          .from('vehicles')
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
  isDeleted() {
    return this.get('is_deleted')
  },

  // Undelete this vehicle
  async undelete() {
    const { data, error } = await supabase
      .from('vehicles')
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

    if (!attrs.license_plate || attrs.license_plate.trim() === '') {
      errors.license_plate = 'License plate is required';
    }

    if (Object.keys(errors).length > 0) {
      return errors;
    }
  }
});

export default Vehicle;
