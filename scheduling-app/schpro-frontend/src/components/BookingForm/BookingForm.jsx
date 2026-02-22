import { useState, useEffect } from 'react'
import Booking from '../../models/Booking'
import PeopleCollection from '../../collections/PeopleCollection'
import VehiclesCollection from '../../collections/VehiclesCollection'
import EquipmentCollection from '../../collections/EquipmentCollection'
import { useBackboneCollection } from '../../hooks/useBackboneCollection'
import Button from '../common/Button'
import ErrorMessage from '../common/ErrorMessage'
import LoadingSpinner from '../common/LoadingSpinner'
import TransferList from './TransferList'
import RequirementsSection from './RequirementsSection'

export default function BookingForm({ booking, onCancel, onSave }) {
  const [peopleCollection] = useState(() => new PeopleCollection())
  const [vehiclesCollection] = useState(() => new VehiclesCollection())
  const [equipmentCollection] = useState(() => new EquipmentCollection())

  const { models: allPeople, isFetching: fetchingPeople } = useBackboneCollection(peopleCollection)
  const { models: allVehicles, isFetching: fetchingVehicles } = useBackboneCollection(vehiclesCollection)
  const { models: allEquipment, isFetching: fetchingEquipment } = useBackboneCollection(equipmentCollection)

  const [formData, setFormData] = useState({
    title: '',
    location: '',
    start_time: '',
    end_time: '',
    notes: '',
    people: [],
    vehicles: [],
    equipment: [],
    requirements: {
      people: [],
      vehicles: [],
      equipment: []
    }
  })

  const [errors, setErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  const isEdit = Boolean(booking)

  // Fetch resources on mount
  useEffect(() => {
    peopleCollection.fetch()
    vehiclesCollection.fetch()
    equipmentCollection.fetch()
  }, [])

  // Load booking data if editing
  useEffect(() => {
    if (booking) {
      const formatDateTimeLocal = (isoString) => {
        if (!isoString) return ''
        const date = new Date(isoString)
        return date.toISOString().slice(0, 16)
      }

      setFormData({
        title: booking.get('title') || '',
        location: booking.get('location') || '',
        start_time: formatDateTimeLocal(booking.get('start_time')),
        end_time: formatDateTimeLocal(booking.get('end_time')),
        notes: booking.get('notes') || '',
        people: booking.get('people') || [],
        vehicles: booking.get('vehicles') || [],
        equipment: booking.get('equipment') || [],
        requirements: booking.get('requirements') || {
          people: [],
          vehicles: [],
          equipment: []
        }
      })
    }
  }, [booking])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const handleResourceChange = (resourceType, selectedIds) => {
    setFormData(prev => ({ ...prev, [resourceType]: selectedIds }))
    if (errors.resources) {
      setErrors(prev => ({ ...prev, resources: null }))
    }
  }

  const handleRequirementsChange = (newRequirements) => {
    setFormData(prev => ({ ...prev, requirements: newRequirements }))
    // Clear requirements-related errors
    const newErrors = { ...errors }
    Object.keys(newErrors).forEach(key => {
      if (key.startsWith('requirements.')) {
        delete newErrors[key]
      }
    })
    setErrors(newErrors)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setSaveError(null)
    setIsSaving(true)

    try {
      // Convert datetime-local to ISO string
      const dataToSave = {
        ...formData,
        start_time: formData.start_time ? new Date(formData.start_time).toISOString() : '',
        end_time: formData.end_time ? new Date(formData.end_time).toISOString() : '',
      }

      let model
      if (isEdit) {
        model = booking
        model.set(dataToSave)
      } else {
        model = new Booking(dataToSave)
      }

      // Validate
      const validationErrors = model.validate(model.attributes)
      if (validationErrors) {
        setErrors(validationErrors)
        setIsSaving(false)
        return
      }

      // Save
      await model.save()

      // Success
      onSave()
    } catch (err) {
      setSaveError(err)
      setIsSaving(false)
    }
  }

  const isLoading = fetchingPeople || fetchingVehicles || fetchingEquipment

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          {isEdit ? 'Edit Booking' : 'Create New Booking'}
        </h3>
      </div>

      <div className="px-4 py-5 sm:p-6">
        {saveError && <ErrorMessage error={saveError} onDismiss={() => setSaveError(null)} />}

        {isLoading ? (
          <LoadingSpinner message="Loading resources..." />
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Site Inspection - Downtown"
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>

            {/* Location */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., 123 Main St"
              />
            </div>

            {/* Start and End Time */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.start_time ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.start_time && <p className="mt-1 text-sm text-red-600">{errors.start_time}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time *
                </label>
                <input
                  type="datetime-local"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.end_time ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.end_time && <p className="mt-1 text-sm text-red-600">{errors.end_time}</p>}
              </div>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Additional details about the booking..."
              />
            </div>

            {/* Requirements Section */}
            <RequirementsSection
              requirements={formData.requirements}
              onChange={handleRequirementsChange}
              errors={errors}
            />

            {/* Resource Assignment */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">Assign Resources *</h4>
              {errors.resources && (
                <p className="mb-4 text-sm text-red-600">{errors.resources}</p>
              )}

              {/* People Transfer List */}
              <div className="mb-4">
                <TransferList
                  title="People"
                  availableItems={allPeople
                    .filter(p => p.isAssignable())
                    .map(p => ({ id: p.id, name: p.get('name'), details: p.get('email') }))}
                  selectedIds={formData.people}
                  onChange={(ids) => handleResourceChange('people', ids)}
                  emptyMessage="No assignable people available"
                />
              </div>

              {/* Vehicles Transfer List */}
              <div className="mb-4">
                <TransferList
                  title="Vehicles"
                  availableItems={allVehicles
                    .filter(v => !v.isDeleted())
                    .map(v => ({ id: v.id, name: v.get('name'), details: v.get('license_plate') }))}
                  selectedIds={formData.vehicles}
                  onChange={(ids) => handleResourceChange('vehicles', ids)}
                  emptyMessage="No vehicles available"
                />
              </div>

              {/* Equipment Transfer List */}
              <div className="mb-4">
                <TransferList
                  title="Equipment"
                  availableItems={allEquipment
                    .filter(e => !e.isDeleted())
                    .map(e => ({ id: e.id, name: e.get('name'), details: e.get('serial_number') }))}
                  selectedIds={formData.equipment}
                  onChange={(ids) => handleResourceChange('equipment', ids)}
                  emptyMessage="No equipment available"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                onClick={onCancel}
                variant="secondary"
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : (isEdit ? 'Update Booking' : 'Create Booking')}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
