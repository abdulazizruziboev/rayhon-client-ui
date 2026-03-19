import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
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

const FALLBACK_IMAGE = '/img-nf.png'

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
    <motion.div
      layout
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.2 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-2xl border border-black/10 bg-white/80 shadow-[0_10px_24px_rgba(15,23,42,0.06)] backdrop-blur"
    >
      <motion.article
        transition={{ duration: 0.15 }}
        className="relative flex gap-3 bg-white/80 p-2.5"
      >
        <img
          src={food.rasm}
          alt={food.nomi}
          onError={(event) => {
            event.currentTarget.onerror = null
            event.currentTarget.src = FALLBACK_IMAGE
          }}
          className="h-[92px] w-[92px] shrink-0 rounded-xl object-cover"
        />

        <div className="min-w-0 flex-1">
          <div className="line-clamp-2 text-sm font-semibold text-slate-900">{food.nomi}</div>
          <div className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-200">
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
              {food.mavjudligi ? 'Mavjud' : 'Qolmagan'}
            </span>
          </div>
        </div>
      </motion.article>
    </motion.div>
  )
}

export default function App() {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [catalogEdgeShadow, setCatalogEdgeShadow] = useState({ left: false, right: false })
  const searchRef = useRef(null)
  const categoryScrollRef = useRef(null)
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

  useEffect(() => {
    const element = categoryScrollRef.current
    if (!element || isCategoryPage || query.trim()) {
      setCatalogEdgeShadow({ left: false, right: false })
      return
    }

    const updateShadows = () => {
      const maxScrollLeft = element.scrollWidth - element.clientWidth
      if (maxScrollLeft <= 1) {
        setCatalogEdgeShadow({ left: false, right: false })
        return
      }

      const left = element.scrollLeft > 2
      const right = element.scrollLeft < maxScrollLeft - 2
      setCatalogEdgeShadow({ left, right })
    }

    updateShadows()
    element.addEventListener('scroll', updateShadows, { passive: true })
    window.addEventListener('resize', updateShadows)

    return () => {
      element.removeEventListener('scroll', updateShadows)
      window.removeEventListener('resize', updateShadows)
    }
  }, [isCategoryPage, query])

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="min-h-screen bg-white p-3 text-slate-900"
    >
      <section className="mx-auto max-w-7xl">
        <motion.div
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="mb-3 px-1"
        >
          <p className="text-base font-semibold text-slate-800">Rayhon milliy taomlari</p>
        </motion.div>

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
          className="mb-4 rounded-2xl border border-black/10 bg-white/70 px-4 py-2 focus-within:border-black/50 "
        >
          <div className="flex items-center gap-3">
            <Search className="size-4 shrink-0 text-slate-500" />
            <Input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Qidirish..."
              className="h-[30px] border-0 bg-transparent px-0 text-sm text-slate-900 placeholder:text-slate-500 focus-visible:ring-0"
            />
          </div>
        </div>

        {!isCategoryPage && !query.trim() && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="relative mb-4"
          >
            <div
              className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-white to-transparent transition-opacity duration-200 ${
                catalogEdgeShadow.left ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <div
              className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-white to-transparent transition-opacity duration-200 ${
                catalogEdgeShadow.right ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <div ref={categoryScrollRef} className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((category) => {
                const Icon = getCategoryIcon(category)
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className="flex shrink-0 cursor-pointer items-center gap-2 rounded-full border bg-white/75 px-3 py-1.5 text-xs font-medium text-slate-700 backdrop-blur transition hover:bg-white"
                  >
                    <Icon className="size-3.5" />
                    {category}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
        {query.trim() ? (
          <motion.section
            key="search-results"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="space-y-3"
          >
            <div className="px-1">
              <h2 className="text-lg font-semibold text-slate-900">Qidiruv natijalari</h2>
              <p className="text-sm text-slate-500">{searchResults.length} ta taom topildi</p>
            </div>
            {searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((food) => (
                  <FoodRow key={food.id} food={food} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-white px-4 py-8 text-center text-sm font-medium text-slate-500">
                Taomlar topilmadi
              </div>
            )}
          </motion.section>
        ) : !isCategoryPage ? (
          <motion.section
            key="all-foods"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="space-y-3"
          >
            <div className="px-1">
              <h2 className="text-lg font-semibold text-slate-900">Barcha taomlar</h2>
              <p className="text-xs text-slate-500">{categoryItems.length} ta taom</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {categoryItems.map((food) => (
                <FoodRow key={food.id} food={food} />
              ))}
            </div>
          </motion.section>
        ) : (
          <motion.section
            key="category-foods"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
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
                className="flex cursor-pointer items-center gap-2 rounded-full border border-black/10 bg-white/80 px-3 py-1.5 text-sm font-medium text-slate-700 backdrop-blur transition hover:bg-white"
              >
                <ArrowLeft className="size-4" />
                Orqaga
              </button>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{selectedCategory || 'Barchasi'}</h2>
                <p className="text-xs text-slate-500">{categoryItems.length} ta taom</p>
              </div>
            </div>
            <div className="space-y-2">
              {categoryItems.map((food) => (
                <FoodRow key={food.id} food={food} />
              ))}
            </div>
          </motion.section>
        )}
        </AnimatePresence>
      </section>
    </motion.main>
  )
}
