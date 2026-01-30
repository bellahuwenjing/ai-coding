import { useState, useEffect, useMemo } from 'react'
import BookingsCollection from '../../collections/BookingsCollection'
import PeopleCollection from '../../collections/PeopleCollection'
import VehiclesCollection from '../../collections/VehiclesCollection'
import EquipmentCollection from '../../collections/EquipmentCollection'
import { useBackboneCollection } from '../../hooks/useBackboneCollection'
import { isAdmin } from '../../services/mockAuth'
import Button from '../common/Button'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorMessage from '../common/ErrorMessage'

export default function BookingsList({ onEdit }) {
  const [bookingsCollection] = useState(() => new BookingsCollection())
  const [peopleCollection] = useState(() => new PeopleCollection())
  const [vehiclesCollection] = useState(() => new VehiclesCollection())
  const [equipmentCollection] = useState(() => new EquipmentCollection())

  const { models: bookings, isFetching, error, fetch } = useBackboneCollection(bookingsCollection)
  const { models: people } = useBackboneCollection(peopleCollection)
  const { models: vehicles } = useBackboneCollection(vehiclesCollection)
  const { models: equipment } = useBackboneCollection(equipmentCollection)

  const [localError, setLocalError] = useState(null)
  const userIsAdmin = isAdmin()

  // Fetch all data on mount
  useEffect(() => {
    fetch()
    peopleCollection.fetch()
    vehiclesCollection.fetch()
    equipmentCollection.fetch()
  }, [])

  // Helper to get resource names
  const getResourceNames = (ids, collection) => {
    return ids.map(id => {
      const model = collection.find(m => m.id === id)
      return model ? model.get('name') : `Unknown (${id})`
    }).join(', ')
  }

  // Handle delete
  const handleDelete = async (booking) => {
    if (!window.confirm(`Are you sure you want to delete "${booking.get('title')}"?`)) {
      return
    }

    try {
      await booking.destroy()
      fetch()
    } catch (err) {
      setLocalError(err)
    }
  }

  // Handle undelete
  const handleUndelete = async (booking) => {
    try {
      await booking.undelete()
      fetch()
    } catch (err) {
      setLocalError(err)
    }
  }

  // Get active and deleted separately
  const activeBookings = useMemo(() => bookings.filter(b => !b.get('is_deleted')), [bookings])
  const deletedBookings = useMemo(() => bookings.filter(b => b.get('is_deleted')), [bookings])

  // Format date/time
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '-'
    const date = new Date(dateTimeString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  if (isFetching && bookings.length === 0) {
    return <LoadingSpinner message="Loading bookings..." />
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Bookings</h2>
        {userIsAdmin && (
          <Button onClick={() => onEdit(null)}>
            Create Booking
          </Button>
        )}
      </div>

      {(error || localError) && (
        <ErrorMessage
          error={error || localError}
          onDismiss={() => setLocalError(null)}
        />
      )}

      {/* Active Bookings */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium text-gray-900">Active Bookings ({activeBookings.length})</h3>
        </div>
        <div className="border-t border-gray-200">
          {activeBookings.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              No bookings found. {userIsAdmin && 'Click "Create Booking" to create one.'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {activeBookings.map((booking) => (
                <div key={booking.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-gray-900">{booking.get('title')}</h4>
                      <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Start:</span>
                          <span className="ml-2 text-gray-600">{formatDateTime(booking.get('start_time'))}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">End:</span>
                          <span className="ml-2 text-gray-600">{formatDateTime(booking.get('end_time'))}</span>
                        </div>
                        {booking.get('location') && (
                          <div className="col-span-2">
                            <span className="font-medium text-gray-700">Location:</span>
                            <span className="ml-2 text-gray-600">{booking.get('location')}</span>
                          </div>
                        )}
                      </div>

                      {/* Assigned Resources */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {booking.get('people')?.length > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                            👥 {booking.get('people').length} People: {getResourceNames(booking.get('people'), people)}
                          </span>
                        )}
                        {booking.get('vehicles')?.length > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                            🚗 {booking.get('vehicles').length} Vehicles: {getResourceNames(booking.get('vehicles'), vehicles)}
                          </span>
                        )}
                        {booking.get('equipment')?.length > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                            🔧 {booking.get('equipment').length} Equipment: {getResourceNames(booking.get('equipment'), equipment)}
                          </span>
                        )}
                      </div>

                      {booking.get('notes') && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Notes:</span> {booking.get('notes')}
                        </div>
                      )}
                    </div>

                    {userIsAdmin && (
                      <div className="ml-4 flex space-x-2">
                        <button
                          onClick={() => onEdit(booking)}
                          className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(booking)}
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Deleted Bookings */}
      {userIsAdmin && deletedBookings.length > 0 && (
        <div className="bg-gray-50 shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium text-gray-700">Deleted Bookings ({deletedBookings.length})</h3>
          </div>
          <div className="border-t border-gray-200 divide-y divide-gray-200">
            {deletedBookings.map((booking) => (
              <div key={booking.id} className="px-6 py-4 opacity-60">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{booking.get('title')}</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      {formatDateTime(booking.get('start_time'))} - {formatDateTime(booking.get('end_time'))}
                    </p>
                  </div>
                  <button
                    onClick={() => handleUndelete(booking)}
                    className="text-green-600 hover:text-green-900 text-sm font-medium"
                  >
                    Undelete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
