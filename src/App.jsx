import { useMemo, useRef, useState } from 'react'
import { ArrowLeft, Beef, CakeSlice, Fish, Leaf, Sandwich, Search, Soup, Wine } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import foods from './foods.json'

function formatPrice(value) {
  return new Intl.NumberFormat('uz-UZ').format(value)
}

// Direct image URL to avoid broken page link
const FALLBACK_IMAGE = 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png'

export default function App() {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const searchRef = useRef(null)

  const groupedFoods = useMemo(() => {
    const term = query.trim().toLowerCase()
    const filtered = foods.filter((food) => {
      if (!term) return true

      return (
        food.nomi.toLowerCase().includes(term)
      )
    })

    return filtered.reduce((acc, food) => {
      if (!acc[food.kategoriya]) {
        acc[food.kategoriya] = []
      }

      acc[food.kategoriya].push(food)
      return acc
    }, {})
  }, [query])

  const categories = Object.keys(groupedFoods)
  const isCategoryPage = Boolean(selectedCategory)
  const categoryItems = selectedCategory ? groupedFoods[selectedCategory] ?? [] : []
  const searchResults = query.trim()
    ? Object.values(groupedFoods).flat()
    : []

  const getCategoryIcon = (category) => {
    if (category.includes('Sho\'rva') || category.includes('Chalop') || category.includes('Xash')) {
      return Soup
    }
    if (category.includes('Shirinlik') || category.includes('Paxlava') || category.includes('Chak-chak')) {
      return CakeSlice
    }
    if (category.includes('Non')) {
      return Sandwich
    }
    if (category.includes('Ichimlik')) {
      return Wine
    }
    if (category.includes('Salat')) {
      return Leaf
    }
    if (category.includes('Baliq')) {
      return Fish
    }
    return Beef
  }

  return (
    <main className="min-h-screen bg-transparent p-4 text-slate-900">
      <section className="mx-auto min-h-[calc(100vh-2rem)] max-w-7xl">
        <div className="mb-4 px-1 py-1">
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
          className="mb-4 rounded-3xl border border-orange-100 bg-orange-50 px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <Search className="size-4 shrink-0 text-slate-400" />
            <Input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Qidirish..."
              className="h-[25px] border-0 bg-transparent px-0 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-0"
            />
          </div>
        </div>

        <div
          className={`gap-4 ${
            isCategoryPage || query.trim() ? 'block' : 'grid lg:grid-cols-[260px_1fr]'
          }`}
        >
          {!isCategoryPage && !query.trim() && (
            <aside className="rounded-3xl p-4">
              <div className="mb-4">
                <h1 className="text-lg font-bold tracking-tight">Menu katalog</h1>
                <p className="text-sm text-slate-500">Kategoriya tanlang</p>
              </div>

              <div className="mt-4 space-y-2">
                {categories.map((category) => {
                  const Icon = getCategoryIcon(category)
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-orange-100"
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="size-4 text-orange-500" />
                        {category}
                      </span>
                      <span className="text-xs opacity-70">{groupedFoods[category]?.length ?? 0}</span>
                    </button>
                  )
                })}
              </div>
            </aside>
          )}

          <div className="rounded-3xl p-4">
            {query.trim() ? (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Qidiruv natijalari</h2>
                  <p className="text-sm text-slate-500">{searchResults.length} ta taom topildi</p>
                </div>

              {searchResults.length === 0 ? (
                <div className="rounded-3xl bg-orange-50 p-6 text-center text-slate-500">
                  Hech narsa topilmadi.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {searchResults.map((food) => (
                    <Card key={food.id} className="overflow-hidden rounded-[6px] bg-transparent text-slate-900 !pt-0">
                      <div className="relative">
                        <img
                          src={food.rasm}
                          alt={food.nomi}
                          onError={(event) => {
                            event.currentTarget.onerror = null
                            event.currentTarget.src = FALLBACK_IMAGE
                          }}
                          className="h-[250px] w-full object-cover"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/35 to-transparent" />
                        <span
                          className={`absolute bottom-2 left-2 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white ${
                            food.mavjudligi ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        >
                          {food.mavjudligi ? 'Tayyor' : 'Qolmagan'}
                        </span>
                        <span className="absolute bottom-2 right-2 rounded-full bg-orange-500 px-2.5 py-1 text-[11px] font-semibold text-white">
                          {formatPrice(food.narxi)} so'm
                        </span>
                        <div className="absolute left-2 top-2 rounded-full bg-white/90 p-1.5 text-slate-700">
                          {(() => {
                            const Icon = getCategoryIcon(food.kategoriya)
                            return <Icon className="size-3.5 text-orange-500" />
                          })()}
                        </div>
                      </div>
                      <CardHeader className="space-y-1 px-3 pb-0 pt-0">
                        <CardTitle className="truncate text-sm font-bold">{food.nomi}</CardTitle>
                        <CardDescription className="w-fit rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-600">
                          {food.kategoriya}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2 px-3 pb-3 pt-2">
                        <p className="line-clamp-2 text-xs leading-5 text-slate-600">
                          {food.tarkibi}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              </div>
            ) : !isCategoryPage ? (
              <div className="rounded-3xl bg-orange-50 p-6 text-slate-600">
                Kategoriya bosganda shu yerda alohida sahifa ochiladi.
              </div>
            ) : (
              <div className="space-y-5">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="flex cursor-pointer items-center gap-2 rounded-full border border-orange-100 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-orange-50 hover:text-slate-900"
                >
                  <ArrowLeft className="size-4" />
                  Orqaga
                </button>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">{selectedCategory}</h2>
                  <p className="text-sm text-slate-500">{categoryItems.length} ta taom</p>
                </div>
              </div>

              {categoryItems.length === 0 ? (
                <div className="rounded-3xl bg-orange-50 p-6 text-center text-slate-500">
                  Hech narsa topilmadi.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {categoryItems.map((food) => (
                    <Card key={food.id} className="overflow-hidden rounded-[6px] bg-transparent text-slate-900 pt-0">
                      <div className="relative">
                        <img
                          src={food.rasm}
                          alt={food.nomi}
                          onError={(event) => {
                            event.currentTarget.onerror = null
                            event.currentTarget.src = FALLBACK_IMAGE
                          }}
                          className="h-[250px] w-full object-cover"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/35 to-transparent" />
                        <span
                          className={`absolute bottom-2 left-2 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white ${
                            food.mavjudligi ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        >
                          {food.mavjudligi ? 'Tayyor' : 'Qolmagan'}
                        </span>
                        <span className="absolute bottom-2 right-2 rounded-full bg-orange-500 px-2.5 py-1 text-[11px] font-semibold text-white">
                          {formatPrice(food.narxi)} so'm
                        </span>
                        <div className="absolute left-2 top-2 rounded-full bg-white/90 p-1.5 text-slate-700">
                          {(() => {
                            const Icon = getCategoryIcon(food.kategoriya)
                            return <Icon className="size-3.5 text-orange-500" />
                          })()}
                        </div>
                      </div>
                      <CardHeader className="space-y-1 px-3 pb-0 pt-0">
                        <CardTitle className="truncate text-sm font-bold">{food.nomi}</CardTitle>
                        <CardDescription className="w-fit rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-600">
                          {food.kategoriya}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2 px-3 pb-3 pt-2">
                        <p className="line-clamp-2 text-xs leading-5 text-slate-600">
                          {food.tarkibi}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
