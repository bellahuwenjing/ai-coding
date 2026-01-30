import { useState, useEffect } from 'react'
import Equipment from '../../models/Equipment'
import Button from '../common/Button'
import ErrorMessage from '../common/ErrorMessage'

export default function EquipmentForm({ equipment, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    serial_number: '',
    condition: 'Good',
  })
  const [errors, setErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  const isEdit = Boolean(equipment)

  // Load equipment data if editing
  useEffect(() => {
    if (equipment) {
      setFormData({
        name: equipment.get('name') || '',
        type: equipment.get('type') || '',
        serial_number: equipment.get('serial_number') || '',
        condition: equipment.get('condition') || 'Good',
      })
    }
  }, [equipment])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
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
        // Update existing equipment
        model = equipment
        model.set(formData)
      } else {
        // Create new equipment
        model = new Equipment(formData)
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
            {isEdit ? 'Edit Equipment' : 'Add New Equipment'}
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
                placeholder="e.g., Generator 5000W"
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
                placeholder="e.g., Generator, Power Tool"
              />
            </div>

            {/* Serial Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Serial Number *
              </label>
              <input
                type="text"
                name="serial_number"
                value={formData.serial_number}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md font-mono ${
                  errors.serial_number ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., GEN-001"
              />
              {errors.serial_number && <p className="mt-1 text-sm text-red-600">{errors.serial_number}</p>}
            </div>

            {/* Condition */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Condition
              </label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
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
