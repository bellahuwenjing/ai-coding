import { useState, useEffect, useMemo } from 'react'
import VehiclesCollection from '../../collections/VehiclesCollection'
import Vehicle from '../../models/Vehicle'
import { useBackboneCollection } from '../../hooks/useBackboneCollection'
import Button from '../common/Button'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorMessage from '../common/ErrorMessage'
import VehicleForm from './VehicleForm'

export default function VehiclesList() {
  const [collection] = useState(() => new VehiclesCollection())
  const { models, isFetching, error, fetch } = useBackboneCollection(collection)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [localError, setLocalError] = useState(null)
  // MVP: All users are admins
  const userIsAdmin = true

  // Fetch data on mount
  useEffect(() => {
    fetch()
  }, [])

  // Handle delete
  const handleDelete = async (vehicle) => {
    if (!window.confirm(`Are you sure you want to delete ${vehicle.get('name')}?`)) {
      return
    }

    try {
      await vehicle.destroy()
      fetch() // Refresh list
    } catch (err) {
      setLocalError(err)
    }
  }

  // Handle undelete
  const handleUndelete = async (vehicle) => {
    try {
      await vehicle.undelete()
      fetch() // Refresh list
    } catch (err) {
      setLocalError(err)
    }
  }

  // Handle edit
  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle)
    setIsFormOpen(true)
  }

  // Handle form close
  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingVehicle(null)
    fetch() // Refresh list
  }

  // Get active and deleted separately
  const activeVehicles = useMemo(() => models.filter(v => !v.get('is_deleted')), [models])
  const deletedVehicles = useMemo(() => models.filter(v => v.get('is_deleted')), [models])

  if (isFetching && models.length === 0) {
    return <LoadingSpinner message="Loading vehicles..." />
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Vehicles Management</h2>
        {userIsAdmin && (
          <Button onClick={() => setIsFormOpen(true)}>
            Add Vehicle
          </Button>
        )}
      </div>

      {(error || localError) && (
        <ErrorMessage
          error={error || localError}
          onDismiss={() => setLocalError(null)}
        />
      )}

      {/* Active Vehicles */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium text-gray-900">Active Vehicles ({activeVehicles.length})</h3>
        </div>
        <div className="border-t border-gray-200">
          {activeVehicles.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              No vehicles found. {userIsAdmin && 'Click "Add Vehicle" to create one.'}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Make/Model</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License Plate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                  {userIsAdmin && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeVehicles.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {vehicle.get('name')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vehicle.get('type') || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vehicle.get('make')} {vehicle.get('model')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vehicle.get('year')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="font-mono">{vehicle.get('license_plate')}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vehicle.get('capacity')} people
                    </td>
                    {userIsAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit(vehicle)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(vehicle)}
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

      {/* Deleted Vehicles */}
      {userIsAdmin && deletedVehicles.length > 0 && (
        <div className="bg-gray-50 shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium text-gray-700">Deleted Vehicles ({deletedVehicles.length})</h3>
          </div>
          <div className="border-t border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License Plate</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deletedVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="opacity-60">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {vehicle.get('name')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vehicle.get('license_plate')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleUndelete(vehicle)}
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

      {/* Vehicle Form Modal */}
      {isFormOpen && (
        <VehicleForm
          vehicle={editingVehicle}
          onClose={handleFormClose}
        />
      )}
    </div>
  )
}
