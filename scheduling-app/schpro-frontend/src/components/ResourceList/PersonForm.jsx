import { useState, useEffect } from 'react'
import { track } from '@vercel/analytics'
import Person from '../../models/Person'
import Button from '../common/Button'
import ErrorMessage from '../common/ErrorMessage'

export default function PersonForm({ person, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    home_address: '',
    skills: [],
  })
  const [skillInput, setSkillInput] = useState('')
  const [errors, setErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  const isEdit = Boolean(person)

  // Load person data if editing
  useEffect(() => {
    if (person) {
      setFormData({
        name: person.get('name') || '',
        email: person.get('email') || '',
        phone: person.get('phone') || '',
        home_address: person.get('home_address') || '',
        skills: person.get('skills') || [],
      })
    }
  }, [person])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const handleAddSkill = () => {
    if (skillInput.trim()) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }))
      setSkillInput('')
    }
  }

  const handleRemoveSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setSaveError(null)
    setIsSaving(true)

    try {
      let model
      if (isEdit) {
        // Update existing person
        model = person
        model.set(formData)
      } else {
        // Create new person
        model = new Person(formData)
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

      track(isEdit ? 'person_updated' : 'person_created')

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
            {isEdit ? 'Edit Person' : 'Add New Person'}
          </h3>
        </div>

        {saveError && <ErrorMessage error={saveError} onDismiss={() => setSaveError(null)} />}

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div className="mb-4">
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
              placeholder="Enter name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter email"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter phone number"
            />
          </div>

          {/* Home Address */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Home Address
            </label>
            <input
              type="text"
              name="home_address"
              value={formData.home_address}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="e.g. 123 Main St, San Francisco, CA 94105"
            />
          </div>

          {/* Skills */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Skills
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter a skill and press Add"
              />
              <Button
                type="button"
                onClick={handleAddSkill}
                variant="secondary"
              >
                Add
              </Button>
            </div>
            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(index)}
                      className="ml-2 text-primary-600 hover:text-primary-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
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
