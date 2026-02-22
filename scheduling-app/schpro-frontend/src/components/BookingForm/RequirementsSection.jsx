import { useState } from 'react'
import Button from '../common/Button'

export default function RequirementsSection({ requirements, onChange, errors = {} }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleAddRequirement = (type) => {
    const newReqs = { ...requirements }
    const emptyReq = {
      people: { role: '', skills: [], certifications: [], quantity: 1 },
      vehicles: { type: '', min_capacity: '', quantity: 1 },
      equipment: { type: '', min_condition: '', quantity: 1 }
    }
    newReqs[type] = [...(newReqs[type] || []), emptyReq[type]]
    onChange(newReqs)
  }

  const handleRemoveRequirement = (type, index) => {
    const newReqs = { ...requirements }
    newReqs[type] = newReqs[type].filter((_, i) => i !== index)
    onChange(newReqs)
  }

  const handleRequirementChange = (type, index, field, value) => {
    const newReqs = { ...requirements }
    newReqs[type] = [...(newReqs[type] || [])]
    newReqs[type][index] = {
      ...newReqs[type][index],
      [field]: value
    }
    onChange(newReqs)
  }

  const handleArrayFieldChange = (type, index, field, value) => {
    // Convert comma-separated string to array
    const arrayValue = value.split(',').map(s => s.trim()).filter(Boolean)
    handleRequirementChange(type, index, field, arrayValue)
  }

  const peopleReqs = requirements?.people || []
  const vehicleReqs = requirements?.vehicles || []
  const equipmentReqs = requirements?.equipment || []

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-md font-medium text-gray-900">
          Resource Requirements
          <span className="text-sm text-gray-500 ml-2">(Optional - for AI scheduling)</span>
        </h4>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {isExpanded ? '− Collapse' : '+ Expand'}
        </button>
      </div>

      {isExpanded && (
        <div className="border border-gray-200 rounded-md p-4 space-y-6">
          {/* People Requirements */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">People Requirements</label>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => handleAddRequirement('people')}
              >
                + Add
              </Button>
            </div>

            {peopleReqs.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No people requirements specified</p>
            ) : (
              <div className="space-y-3">
                {peopleReqs.map((req, idx) => (
                  <div key={idx} className="border border-gray-200 rounded p-3 bg-gray-50">
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Role</label>
                        <input
                          type="text"
                          value={req.role || ''}
                          onChange={(e) => handleRequirementChange('people', idx, 'role', e.target.value)}
                          placeholder="e.g., welder, driver"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Quantity *</label>
                        <input
                          type="number"
                          min="1"
                          value={req.quantity || 1}
                          onChange={(e) => handleRequirementChange('people', idx, 'quantity', parseInt(e.target.value) || 1)}
                          className={`w-full px-2 py-1 text-sm border rounded ${
                            errors[`requirements.people.${idx}.quantity`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors[`requirements.people.${idx}.quantity`] && (
                          <p className="text-xs text-red-600 mt-1">{errors[`requirements.people.${idx}.quantity`]}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Skills (comma-separated)</label>
                        <input
                          type="text"
                          value={Array.isArray(req.skills) ? req.skills.join(', ') : ''}
                          onChange={(e) => handleArrayFieldChange('people', idx, 'skills', e.target.value)}
                          placeholder="e.g., welding, rigging"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Certifications (comma-separated)</label>
                        <input
                          type="text"
                          value={Array.isArray(req.certifications) ? req.certifications.join(', ') : ''}
                          onChange={(e) => handleArrayFieldChange('people', idx, 'certifications', e.target.value)}
                          placeholder="e.g., AWS D1.1, OSHA 30"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveRequirement('people', idx)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Vehicle Requirements */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Vehicle Requirements</label>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => handleAddRequirement('vehicles')}
              >
                + Add
              </Button>
            </div>

            {vehicleReqs.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No vehicle requirements specified</p>
            ) : (
              <div className="space-y-3">
                {vehicleReqs.map((req, idx) => (
                  <div key={idx} className="border border-gray-200 rounded p-3 bg-gray-50">
                    <div className="grid grid-cols-3 gap-3 mb-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Type</label>
                        <input
                          type="text"
                          value={req.type || ''}
                          onChange={(e) => handleRequirementChange('vehicles', idx, 'type', e.target.value)}
                          placeholder="e.g., van, truck"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Min Capacity</label>
                        <input
                          type="number"
                          min="1"
                          value={req.min_capacity || ''}
                          onChange={(e) => handleRequirementChange('vehicles', idx, 'min_capacity', e.target.value ? parseInt(e.target.value) : null)}
                          placeholder="e.g., 8"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Quantity *</label>
                        <input
                          type="number"
                          min="1"
                          value={req.quantity || 1}
                          onChange={(e) => handleRequirementChange('vehicles', idx, 'quantity', parseInt(e.target.value) || 1)}
                          className={`w-full px-2 py-1 text-sm border rounded ${
                            errors[`requirements.vehicles.${idx}.quantity`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors[`requirements.vehicles.${idx}.quantity`] && (
                          <p className="text-xs text-red-600 mt-1">{errors[`requirements.vehicles.${idx}.quantity`]}</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveRequirement('vehicles', idx)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Equipment Requirements */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Equipment Requirements</label>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => handleAddRequirement('equipment')}
              >
                + Add
              </Button>
            </div>

            {equipmentReqs.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No equipment requirements specified</p>
            ) : (
              <div className="space-y-3">
                {equipmentReqs.map((req, idx) => (
                  <div key={idx} className="border border-gray-200 rounded p-3 bg-gray-50">
                    <div className="grid grid-cols-3 gap-3 mb-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Type</label>
                        <input
                          type="text"
                          value={req.type || ''}
                          onChange={(e) => handleRequirementChange('equipment', idx, 'type', e.target.value)}
                          placeholder="e.g., welder, drill"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Min Condition</label>
                        <select
                          value={req.min_condition || ''}
                          onChange={(e) => handleRequirementChange('equipment', idx, 'min_condition', e.target.value)}
                          className={`w-full px-2 py-1 text-sm border rounded ${
                            errors[`requirements.equipment.${idx}.min_condition`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Any</option>
                          <option value="excellent">Excellent</option>
                          <option value="good">Good</option>
                          <option value="fair">Fair</option>
                          <option value="poor">Poor</option>
                        </select>
                        {errors[`requirements.equipment.${idx}.min_condition`] && (
                          <p className="text-xs text-red-600 mt-1">{errors[`requirements.equipment.${idx}.min_condition`]}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Quantity *</label>
                        <input
                          type="number"
                          min="1"
                          value={req.quantity || 1}
                          onChange={(e) => handleRequirementChange('equipment', idx, 'quantity', parseInt(e.target.value) || 1)}
                          className={`w-full px-2 py-1 text-sm border rounded ${
                            errors[`requirements.equipment.${idx}.quantity`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors[`requirements.equipment.${idx}.quantity`] && (
                          <p className="text-xs text-red-600 mt-1">{errors[`requirements.equipment.${idx}.quantity`]}</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveRequirement('equipment', idx)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Requirements help the AI scheduling system recommend optimal resources. They are optional and won't affect manual resource assignment.
          </p>
        </div>
      )}
    </div>
  )
}
