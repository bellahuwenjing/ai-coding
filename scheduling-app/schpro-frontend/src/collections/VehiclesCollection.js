import Backbone from 'backbone'
import Vehicle from '../models/Vehicle'
import { supabase } from '../config/supabase'

const VehiclesCollection = Backbone.Collection.extend({
  model: Vehicle,
  comparator: 'name',

  // Override fetch to use Supabase
  fetch(options = {}) {
    const includeDeleted = options.includeDeleted || false

    let query = supabase
      .from('vehicles')
      .select('*')
      .order('name', { ascending: true })

    if (!includeDeleted) {
      query = query.eq('is_deleted', false)
    }

    return query
      .then(({ data, error }) => {
        if (error) {
          console.error('Fetch vehicles error:', error)
          if (options.error) options.error(this, error)
          throw error
        }
        this.reset(data)
        if (options.success) options.success(data)
        this.trigger('sync', this, data, options)
        return data
      })
      .catch((error) => {
        if (options.error) options.error(this, error)
        throw error
      })
  },

  // Get only active (not deleted) vehicles
  getActive() {
    return this.filter(vehicle => !vehicle.isDeleted())
  },

  // Get deleted vehicles
  getDeleted() {
    return this.filter(vehicle => vehicle.isDeleted())
  },
})

export default VehiclesCollection
