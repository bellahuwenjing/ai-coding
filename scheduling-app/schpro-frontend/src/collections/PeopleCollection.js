import Backbone from 'backbone';
import Person from '../models/Person';

const PeopleCollection = Backbone.Collection.extend({
  model: Person,
  url: '/api/people',

  // Get only assignable people (members, not deleted)
  getAssignable() {
    return this.filter(person => person.isAssignable());
  },

  // Get admins
  getAdmins() {
    return this.filter(person => person.isAdmin());
  },

  // Get members
  getMembers() {
    return this.filter(person => person.isMember());
  },

  // Get deleted people
  getDeleted() {
    return this.filter(person => person.isDeleted());
  },
});

export default PeopleCollection;
