type Meal = {
  id: string
  name: string
  role?: string | null
  cuisine: string | null
  meal_type: string
  tags: string[] | null
  user_id: string | null
  ingredient_count?: number
}

export function MealCard({ meal }: { meal: Meal }) {
  const isSystem = meal.user_id === null

  return (
    <article className="card group p-4 transition-colors hover:border-stone-300">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold leading-tight text-stone-900">
          {meal.name}
        </h3>
        <span
          className={`pill shrink-0 ${
            isSystem
              ? 'bg-brand-50 text-brand-700'
              : 'bg-accent-50 text-accent-800'
          }`}
        >
          {isSystem ? 'Catalog' : 'Mine'}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {meal.role && meal.role !== 'dish' && (
          <span className="pill bg-brand-50 text-brand-700">{meal.role}</span>
        )}
        <span className="pill bg-stone-100 text-stone-700">{meal.meal_type}</span>
        {meal.cuisine && (
          <span className="pill bg-stone-100 text-stone-700">{meal.cuisine}</span>
        )}
        {meal.ingredient_count !== undefined && (
          <span className="pill bg-stone-100 text-stone-700">
            {meal.ingredient_count} ingredient
            {meal.ingredient_count === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {meal.tags && meal.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {meal.tags.map((tag) => (
            <span key={tag} className="pill bg-accent-50 text-accent-800">
              {tag}
            </span>
          ))}
        </div>
      )}
    </article>
  )
}