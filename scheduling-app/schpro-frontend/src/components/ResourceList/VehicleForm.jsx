import { useState, useEffect } from 'react'
import Vehicle from '../../models/Vehicle'
import Button from '../common/Button'
import ErrorMessage from '../common/ErrorMessage'

export default function VehicleForm({ vehicle, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    license_plate: '',
    capacity: 1,
  })
  const [errors, setErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  const isEdit = Boolean(vehicle)

  // Load vehicle data if editing
  useEffect(() => {
    if (vehicle) {
      setFormData({
        name: vehicle.get('name') || '',
        type: vehicle.get('type') || '',
        make: vehicle.get('make') || '',
        model: vehicle.get('model') || '',
        year: vehicle.get('year') || new Date().getFullYear(),
        license_plate: vehicle.get('license_plate') || '',
        capacity: vehicle.get('capacity') || 1,
      })
    }
  }, [vehicle])

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setSaveError(null)
    setIsSaving(true)

    try {
      let model
      if (isEdit) {
        // Update existing vehicle
        model = vehicle
        model.set(formData)
      } else {
        // Create new vehicle
        model = new Vehicle(formData)
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

      // Close form
      onClose()
    } catch (err) {
      setSaveError(err)
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {isEdit ? 'Edit Vehicle' : 'Add New Vehicle'}
          </h3>
        </div>

        {saveError && <ErrorMessage error={saveError} onDismiss={() => setSaveError(null)} />}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            {/* Name */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Ford F-150"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <input
                type="text"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., Truck, Van, Car"
              />
            </div>

            {/* License Plate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                License Plate *
              </label>
              <input
                type="text"
                name="license_plate"
                value={formData.license_plate}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md font-mono ${
                  errors.license_plate ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="ABC-123"
              />
              {errors.license_plate && <p className="mt-1 text-sm text-red-600">{errors.license_plate}</p>}
            </div>

            {/* Make */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Make
              </label>
              <input
                type="text"
                name="make"
                value={formData.make}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., Ford, Toyota"
              />
            </div>

            {/* Model */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., F-150, Camry"
              />
            </div>

            {/* Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                min="1900"
                max={new Date().getFullYear() + 1}
              />
            </div>

            {/* Capacity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capacity (people)
              </label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                min="1"
                max="50"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-6">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : (isEdit ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
