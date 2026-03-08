import Button from '../common/Button'

/**
 * Displays ranked AI scheduling solutions.
 * The user can inspect each solution and apply one to pre-fill the resource transfer lists.
 */
export default function AiSolutionsPanel({
  solutions,
  violatedConstraints,
  suggestions,
  allPeople,
  allVehicles,
  allEquipment,
  optimizeFor,
  onUseSolution,
  onDismiss,
}) {
  const peopleById = Object.fromEntries(allPeople.map(p => [p.id, p]))
  const vehiclesById = Object.fromEntries(allVehicles.map(v => [v.id, v]))
  const equipmentById = Object.fromEntries(allEquipment.map(e => [e.id, e]))

  // No feasible solutions — show diagnostic info
  if (!solutions || solutions.length === 0) {
    return (
      <div className="mt-4 border border-orange-200 rounded-md bg-orange-50 p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h5 className="text-sm font-semibold text-orange-800 mb-2">
              No feasible assignments found
            </h5>
            {violatedConstraints?.length > 0 && (
              <ul className="text-sm text-orange-700 mb-3 space-y-1 list-disc list-inside">
                {violatedConstraints.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            )}
            {suggestions?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-orange-700 mb-1">Suggestions:</p>
                <ul className="text-xs text-orange-600 space-y-1 list-disc list-inside">
                  {suggestions.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="ml-4 text-orange-400 hover:text-orange-600 text-lg leading-none"
          >
            ×
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4 border border-blue-200 rounded-md bg-blue-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h5 className="text-sm font-semibold text-blue-900">
            AI found {solutions.length} solution{solutions.length !== 1 ? 's' : ''}
          </h5>
          <p className="text-xs text-blue-600">Optimized for: {optimizeFor || 'balanced'}</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-blue-400 hover:text-blue-600 text-lg leading-none"
        >
          ×
        </button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {solutions.map((sol, i) => {
          const people = (sol.people_ids || []).map(id => peopleById[id]).filter(Boolean)
          const vehicles = (sol.vehicle_ids || []).map(id => vehiclesById[id]).filter(Boolean)
          const equipment = (sol.equipment_ids || []).map(id => equipmentById[id]).filter(Boolean)

          return (
            <div
              key={i}
              className="bg-white border border-blue-200 rounded-md p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Header: rank + score */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      #{sol.rank}
                    </span>
                    {sol.score != null && (
                      <span className={`text-xs font-medium ${
                        sol.score >= 80 ? 'text-green-700' :
                        sol.score >= 60 ? 'text-yellow-700' : 'text-red-700'
                      }`}>
                        Score: {sol.score}/100
                      </span>
                    )}
                    {sol.estimated_labor_cost != null && (
                      <span className="text-xs text-gray-500">
                        Est. cost: ${sol.estimated_labor_cost.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* AI reasoning */}
                  {sol.reasoning && (
                    <p className="text-xs text-gray-600 mb-2 italic">{sol.reasoning}</p>
                  )}

                  {/* Warnings */}
                  {sol.warnings?.length > 0 && (
                    <div className="mb-2">
                      {sol.warnings.map((w, wi) => (
                        <p key={wi} className="text-xs text-yellow-700 bg-yellow-50 rounded px-2 py-0.5 mb-1">
                          ⚠ {w}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Resource lists */}
                  <div className="text-xs text-gray-700 space-y-1">
                    {people.length > 0 && (
                      <div>
                        <span className="font-medium">People:</span>{' '}
                        {people.map(p => p.get('name')).join(', ')}
                      </div>
                    )}
                    {vehicles.length > 0 && (
                      <div>
                        <span className="font-medium">Vehicles:</span>{' '}
                        {vehicles.map(v => v.get('name')).join(', ')}
                      </div>
                    )}
                    {equipment.length > 0 && (
                      <div>
                        <span className="font-medium">Equipment:</span>{' '}
                        {equipment.map(e => e.get('name')).join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => onUseSolution(sol)}
                  className="shrink-0"
                >
                  Use this
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
