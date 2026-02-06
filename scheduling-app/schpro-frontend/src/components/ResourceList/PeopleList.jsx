import { useState, useEffect, useMemo } from 'react'
import PeopleCollection from '../../collections/PeopleCollection'
import Person from '../../models/Person'
import { useBackboneCollection } from '../../hooks/useBackboneCollection'
import authService from '../../services/auth'
import Button from '../common/Button'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorMessage from '../common/ErrorMessage'
import PersonForm from './PersonForm'

export default function PeopleList() {
  const [collection] = useState(() => new PeopleCollection())
  const { models, isFetching, error, fetch } = useBackboneCollection(collection)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingPerson, setEditingPerson] = useState(null)
  const [localError, setLocalError] = useState(null)
  const userIsAdmin = authService.isAdmin()

  // Fetch data on mount
  useEffect(() => {
    fetch()
  }, [])

  // Handle delete
  const handleDelete = async (person) => {
    if (!window.confirm(`Are you sure you want to delete ${person.get('name')}?`)) {
      return
    }

    try {
      await person.destroy()
      fetch() // Refresh list
    } catch (err) {
      setLocalError(err)
    }
  }

  // Handle undelete
  const handleUndelete = async (person) => {
    try {
      await person.undelete()
      fetch() // Refresh list
    } catch (err) {
      setLocalError(err)
    }
  }

  // Handle edit
  const handleEdit = (person) => {
    setEditingPerson(person)
    setIsFormOpen(true)
  }

  // Handle form close
  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingPerson(null)
    fetch() // Refresh list
  }

  // Get active and deleted separately
  const activePeople = useMemo(() => models.filter(p => !p.get('is_deleted')), [models])
  const deletedPeople = useMemo(() => models.filter(p => p.get('is_deleted')), [models])

  if (isFetching && models.length === 0) {
    return <LoadingSpinner message="Loading people..." />
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">People Management</h2>
        {userIsAdmin && (
          <Button onClick={() => setIsFormOpen(true)}>
            Add Person
          </Button>
        )}
      </div>

      {(error || localError) && (
        <ErrorMessage
          error={error || localError}
          onDismiss={() => setLocalError(null)}
        />
      )}

      {/* Active People */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium text-gray-900">Active People ({activePeople.length})</h3>
        </div>
        <div className="border-t border-gray-200">
          {activePeople.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              No people found. {userIsAdmin && 'Click "Add Person" to create one.'}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skills</th>
                  {userIsAdmin && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activePeople.map((person) => (
                  <tr key={person.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {person.get('name')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {person.get('email')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        person.isAdmin() ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {person.get('role')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {person.get('phone') || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {(person.get('skills') || []).join(', ') || '-'}
                    </td>
                    {userIsAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit(person)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(person)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Deleted People */}
      {userIsAdmin && deletedPeople.length > 0 && (
        <div className="bg-gray-50 shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium text-gray-700">Deleted People ({deletedPeople.length})</h3>
          </div>
          <div className="border-t border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deletedPeople.map((person) => (
                  <tr key={person.id} className="opacity-60">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {person.get('name')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {person.get('email')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {person.get('role')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleUndelete(person)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Undelete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Person Form Modal */}
      {isFormOpen && (
        <PersonForm
          person={editingPerson}
          onClose={handleFormClose}
        />
      )}
    </div>
  )
}
