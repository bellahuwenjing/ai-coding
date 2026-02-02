import { useState, useEffect, useMemo } from 'react'
import EquipmentCollection from '../../collections/EquipmentCollection'
import Equipment from '../../models/Equipment'
import { useBackboneCollection } from '../../hooks/useBackboneCollection'
import Button from '../common/Button'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorMessage from '../common/ErrorMessage'
import EquipmentForm from './EquipmentForm'

export default function EquipmentList() {
  const [collection] = useState(() => new EquipmentCollection())
  const { models, isFetching, error, fetch } = useBackboneCollection(collection)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState(null)
  const [localError, setLocalError] = useState(null)
  // MVP: All users are admins
  const userIsAdmin = true

  // Fetch data on mount
  useEffect(() => {
    fetch()
  }, [])

  // Handle delete
  const handleDelete = async (equipment) => {
    if (!window.confirm(`Are you sure you want to delete ${equipment.get('name')}?`)) {
      return
    }

    try {
      await equipment.destroy()
      fetch() // Refresh list
    } catch (err) {
      setLocalError(err)
    }
  }

  // Handle undelete
  const handleUndelete = async (equipment) => {
    try {
      await equipment.undelete()
      fetch() // Refresh list
    } catch (err) {
      setLocalError(err)
    }
  }

  // Handle edit
  const handleEdit = (equipment) => {
    setEditingEquipment(equipment)
    setIsFormOpen(true)
  }

  // Handle form close
  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingEquipment(null)
    fetch() // Refresh list
  }

  // Get active and deleted separately
  const activeEquipment = useMemo(() => models.filter(e => !e.get('is_deleted')), [models])
  const deletedEquipment = useMemo(() => models.filter(e => e.get('is_deleted')), [models])

  if (isFetching && models.length === 0) {
    return <LoadingSpinner message="Loading equipment..." />
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Equipment Management</h2>
        {userIsAdmin && (
          <Button onClick={() => setIsFormOpen(true)}>
            Add Equipment
          </Button>
        )}
      </div>

      {(error || localError) && (
        <ErrorMessage
          error={error || localError}
          onDismiss={() => setLocalError(null)}
        />
      )}

      {/* Active Equipment */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium text-gray-900">Active Equipment ({activeEquipment.length})</h3>
        </div>
        <div className="border-t border-gray-200">
          {activeEquipment.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              No equipment found. {userIsAdmin && 'Click "Add Equipment" to create one.'}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                  {userIsAdmin && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeEquipment.map((equipment) => (
                  <tr key={equipment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {equipment.get('name')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {equipment.get('type') || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="font-mono">{equipment.get('serial_number')}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        equipment.get('condition') === 'Excellent' ? 'bg-green-100 text-green-800' :
                        equipment.get('condition') === 'Good' ? 'bg-blue-100 text-blue-800' :
                        equipment.get('condition') === 'Fair' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {equipment.get('condition')}
                      </span>
                    </td>
                    {userIsAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit(equipment)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(equipment)}
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

      {/* Deleted Equipment */}
      {userIsAdmin && deletedEquipment.length > 0 && (
        <div className="bg-gray-50 shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium text-gray-700">Deleted Equipment ({deletedEquipment.length})</h3>
          </div>
          <div className="border-t border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deletedEquipment.map((equipment) => (
                  <tr key={equipment.id} className="opacity-60">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {equipment.get('name')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {equipment.get('serial_number')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleUndelete(equipment)}
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

      {/* Equipment Form Modal */}
      {isFormOpen && (
        <EquipmentForm
          equipment={editingEquipment}
          onClose={handleFormClose}
        />
      )}
    </div>
  )
}
