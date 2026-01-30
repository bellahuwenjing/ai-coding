import { useState, useMemo } from 'react'

/**
 * Transfer List Component
 *
 * Allows users to move items between "Available" and "Selected" lists
 * Used for assigning resources (people, vehicles, equipment) to bookings
 */
export default function TransferList({ title, availableItems, selectedIds, onChange, emptyMessage }) {
  const [searchTerm, setSearchTerm] = useState('')

  // Split items into available and selected
  const { available, selected } = useMemo(() => {
    const selectedSet = new Set(selectedIds)
    return {
      available: availableItems.filter(item => !selectedSet.has(item.id)),
      selected: availableItems.filter(item => selectedSet.has(item.id)),
    }
  }, [availableItems, selectedIds])

  // Filter available items by search term
  const filteredAvailable = useMemo(() => {
    if (!searchTerm.trim()) return available
    const search = searchTerm.toLowerCase()
    return available.filter(item =>
      item.name.toLowerCase().includes(search) ||
      (item.details && item.details.toLowerCase().includes(search))
    )
  }, [available, searchTerm])

  // Add item to selected
  const handleAdd = (item) => {
    onChange([...selectedIds, item.id])
  }

  // Remove item from selected
  const handleRemove = (item) => {
    onChange(selectedIds.filter(id => id !== item.id))
  }

  // Add all filtered available items
  const handleAddAll = () => {
    const newIds = filteredAvailable.map(item => item.id)
    onChange([...selectedIds, ...newIds])
  }

  // Remove all selected items
  const handleRemoveAll = () => {
    onChange([])
  }

  return (
    <div>
      <h5 className="text-sm font-medium text-gray-700 mb-2">{title}</h5>

      <div className="grid grid-cols-2 gap-4">
        {/* Available List */}
        <div className="border border-gray-300 rounded-md overflow-hidden">
          <div className="bg-gray-50 px-3 py-2 border-b border-gray-300 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              Available ({filteredAvailable.length})
            </span>
            {filteredAvailable.length > 0 && (
              <button
                type="button"
                onClick={handleAddAll}
                className="text-xs text-primary-600 hover:text-primary-900"
              >
                Add All →
              </button>
            )}
          </div>

          {/* Search */}
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-48">
            {filteredAvailable.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                {searchTerm ? 'No matches found' : (emptyMessage || 'No items available')}
              </div>
            ) : (
              <div>
                {filteredAvailable.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleAdd(item)}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    {item.details && (
                      <div className="text-xs text-gray-500">{item.details}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected List */}
        <div className="border border-gray-300 rounded-md overflow-hidden">
          <div className="bg-primary-50 px-3 py-2 border-b border-gray-300 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              Selected ({selected.length})
            </span>
            {selected.length > 0 && (
              <button
                type="button"
                onClick={handleRemoveAll}
                className="text-xs text-red-600 hover:text-red-900"
              >
                ← Remove All
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-64">
            {selected.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                No items selected
              </div>
            ) : (
              <div>
                {selected.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleRemove(item)}
                    className="px-3 py-2 hover:bg-red-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        {item.details && (
                          <div className="text-xs text-gray-500">{item.details}</div>
                        )}
                      </div>
                      <span className="text-red-500 ml-2">×</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="mt-2 text-xs text-gray-500">
        Click items to move between lists. {selected.length} {title.toLowerCase()} selected.
      </p>
    </div>
  )
}
