import Backbone from 'backbone'
import Equipment from '../models/Equipment'
import { supabase } from '../config/supabase'

const EquipmentCollection = Backbone.Collection.extend({
  model: Equipment,
  comparator: 'name',

  // Override fetch to use Supabase
  fetch(options = {}) {
    const includeDeleted = options.includeDeleted || false

    let query = supabase
      .from('equipment')
      .select('*')
      .order('name', { ascending: true })

    if (!includeDeleted) {
      query = query.eq('is_deleted', false)
    }

    return query
      .then(({ data, error }) => {
        if (error) {
          console.error('Fetch equipment error:', error)
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

  // Get only active (not deleted) equipment
  getActive() {
    return this.filter(item => !item.isDeleted())
  },

  // Get deleted equipment
  getDeleted() {
    return this.filter(item => item.isDeleted())
  },
})

export default EquipmentCollection
