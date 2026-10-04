type Meal = {
  id: string
  name: string
  cuisine: string | null
  meal_type: string
  tags: string[] | null
  user_id: string | null
  ingredient_count?: number
}

export function MealCard({ meal }: { meal: Meal }) {
  const isSystem = meal.user_id === null

  return (
    <div className="bg-white rounded-lg border p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold leading-tight">{meal.name}</h3>
        <span
          className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
            isSystem
              ? 'bg-blue-50 text-blue-700'
              : 'bg-green-50 text-green-700'
          }`}
        >
          {isSystem ? 'Catalog' : 'Mine'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-gray-600">
        <span className="bg-gray-100 px-2 py-0.5 rounded">
          {meal.meal_type}
        </span>
        {meal.cuisine && (
          <span className="bg-gray-100 px-2 py-0.5 rounded">
            {meal.cuisine}
          </span>
        )}
        {meal.ingredient_count !== undefined && (
          <span className="bg-gray-100 px-2 py-0.5 rounded">
            {meal.ingredient_count} ingredient
            {meal.ingredient_count === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {meal.tags && meal.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {meal.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-yellow-50 text-yellow-800 px-2 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}