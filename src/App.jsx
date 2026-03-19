import { useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  Beef,
  CakeSlice,
  Fish,
  Leaf,
  Sandwich,
  Search,
  Soup,
  Wine
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import foods from './foods.json'

const FALLBACK_IMAGE = 'https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg'

function formatPrice(value) {
  return new Intl.NumberFormat('uz-UZ').format(value)
}

function getCategoryIcon(category) {
  if (category.includes("Sho'rva") || category.includes('Chalop') || category.includes('Xash')) return Soup
  if (category.includes('Shirinlik') || category.includes('Paxlava') || category.includes('Chak-chak')) return CakeSlice
  if (category.includes('Non')) return Sandwich
  if (category.includes('Ichimlik')) return Wine
  if (category.includes('Salat')) return Leaf
  if (category.includes('Baliq')) return Fish
  return Beef
}

function FoodRow({ food }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white">
      <article className="relative flex cursor-pointer gap-3 bg-white p-2">
        <img
          src={food.rasm}
          alt={food.nomi}
          onError={(event) => {
            event.currentTarget.onerror = null
            event.currentTarget.src = FALLBACK_IMAGE
          }}
          className="h-[92px] w-[92px] shrink-0 rounded-lg object-cover"
        />

        <div className="min-w-0 flex-1">
          <div className="line-clamp-2 text-sm font-semibold text-slate-900">{food.nomi}</div>
          <div className="mt-1 inline-flex rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-600">
            {food.kategoriya}
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-slate-500">{food.tarkibi}</p>
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-base font-bold text-slate-900">{formatPrice(food.narxi)} so'm</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold text-white ${
                food.mavjudligi ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            >
              {food.mavjudligi ? 'Tayyor' : 'Qolmagan'}
            </span>
          </div>
        </div>
      </article>
    </div>
  )
}

export default function App() {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const searchRef = useRef(null)
  const catalogSwipeStartX = useRef(0)
  const catalogSwipeDeltaX = useRef(0)

  const groupedFoods = useMemo(() => {
    const term = query.trim().toLowerCase()
    const filtered = foods.filter((food) => {
      if (!term) return true
      return (
        food.nomi.toLowerCase().includes(term) ||
        food.tarkibi.toLowerCase().includes(term) ||
        food.kategoriya.toLowerCase().includes(term)
      )
    })

    return filtered.reduce((acc, food) => {
      if (!acc[food.kategoriya]) acc[food.kategoriya] = []
      acc[food.kategoriya].push(food)
      return acc
    }, {})
  }, [query])

  const categories = Object.keys(groupedFoods)
  const isCategoryPage = Boolean(selectedCategory)
  const searchResults = query.trim() ? Object.values(groupedFoods).flat() : []
  const categoryItems =
    selectedCategory
      ? groupedFoods[selectedCategory] ?? []
      : Object.values(groupedFoods).flat()

  const onCatalogPointerDown = (event) => {
    if (!isCategoryPage) return
    catalogSwipeStartX.current = event.clientX
    catalogSwipeDeltaX.current = 0
  }

  const onCatalogPointerMove = (event) => {
    if (!isCategoryPage) return
    catalogSwipeDeltaX.current = event.clientX - catalogSwipeStartX.current
  }

  const onCatalogPointerUp = () => {
    if (!isCategoryPage) return
    if (catalogSwipeDeltaX.current > 90) {
      setSelectedCategory(null)
    }
    catalogSwipeDeltaX.current = 0
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9] p-3 text-slate-900">
      <section className="mx-auto max-w-7xl">
        <div className="mb-3 px-1">
          <p className="text-base font-semibold text-orange-600">Rayhon milliy taomlari</p>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => searchRef.current?.focus()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              searchRef.current?.focus()
            }
          }}
          className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-2"
        >
          <div className="flex items-center gap-3">
            <Search className="size-4 shrink-0 text-slate-400" />
            <Input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Qidirish..."
              className="h-[30px] border-0 bg-transparent px-0 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-0"
            />
          </div>
        </div>

        {!isCategoryPage && !query.trim() && (
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {categories.map((category) => {
              const Icon = getCategoryIcon(category)
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className="flex shrink-0 cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-orange-200 hover:text-orange-600"
                >
                  <Icon className="size-3.5" />
                  {category}
                </button>
              )
            })}
          </div>
        )}

        {query.trim() ? (
          <section className="space-y-3">
            <div className="px-1">
              <h2 className="text-lg font-bold">Qidiruv natijalari</h2>
              <p className="text-sm text-slate-500">{searchResults.length} ta taom topildi</p>
            </div>
            <div className="space-y-2">
              {searchResults.map((food) => (
                <FoodRow key={food.id} food={food} />
              ))}
            </div>
          </section>
        ) : !isCategoryPage ? (
          <section className="space-y-3">
            <div className="px-1">
              <h2 className="text-lg font-bold">Barcha taomlar</h2>
              <p className="text-xs text-slate-500">{categoryItems.length} ta taom</p>
            </div>
            <div className="space-y-2">
              {categoryItems.map((food) => (
                <FoodRow key={food.id} food={food} />
              ))}
            </div>
          </section>
        ) : (
          <section
            className="space-y-3 touch-pan-y"
            onPointerDown={onCatalogPointerDown}
            onPointerMove={onCatalogPointerMove}
            onPointerUp={onCatalogPointerUp}
            onPointerCancel={onCatalogPointerUp}
          >
            <div className="flex items-center gap-3 px-1">
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                  className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                <ArrowLeft className="size-4" />
                Orqaga
              </button>
              <div>
                <h2 className="text-lg font-bold">{selectedCategory || 'Barchasi'}</h2>
                <p className="text-xs text-slate-500">{categoryItems.length} ta taom</p>
              </div>
            </div>
            <div className="space-y-2">
              {categoryItems.map((food) => (
                <FoodRow key={food.id} food={food} />
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  )
}
