import Backbone from 'backbone'
import Person from '../models/Person'
import { supabase } from '../config/supabase'

const PeopleCollection = Backbone.Collection.extend({
  model: Person,

  // Override fetch to use Supabase
  fetch(options = {}) {
    const includeDeleted = options.includeDeleted || false

    let query = supabase
      .from('people')
      .select('*')
      .order('created_at', { ascending: false })

    if (!includeDeleted) {
      query = query.eq('is_deleted', false)
    }

    return query
      .then(({ data, error }) => {
        if (error) {
          console.error('Fetch people error:', error)
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

  // Get only assignable people (not deleted)
  getAssignable() {
    return this.filter(person => person.isAssignable())
  },

  // Get admins
  getAdmins() {
    return this.filter(person => person.isAdmin())
  },

  // Get members
  getMembers() {
    return this.filter(person => person.isMember())
  },

  // Get deleted people
  getDeleted() {
    return this.filter(person => person.isDeleted())
  },
})

export default PeopleCollection
