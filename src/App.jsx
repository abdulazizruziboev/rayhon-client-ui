import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
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

function FoodRow({ food, isLast }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.2 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="relative flex gap-3 px-[13px] py-3.5"
    >
      <img
        src={food.rasm}
        alt={food.nomi}
        onError={(event) => {
          event.currentTarget.onerror = null
          event.currentTarget.src = FALLBACK_IMAGE
        }}
        className="h-[84px] w-[84px] shrink-0 rounded-2xl object-cover"
      />

      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold leading-5 text-slate-900">{food.nomi}</div>
        <div className="mt-1 inline-flex rounded-full bg-[#e7f7ec] px-2.5 py-0.5 text-[11px] font-medium text-[#1bac4b]">
          {food.kategoriya}
        </div>
        <p className="mt-1.5 truncate text-xs leading-5 text-slate-500">{food.tarkibi}</p>
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <span className="text-[16px] font-bold leading-none text-slate-900">
            {formatPrice(food.narxi)} so'm
          </span>
          <span
            className={`rounded-full px-3 py-1.5 text-[11px] font-semibold leading-none text-white ${
              food.mavjudligi ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          >
            {food.mavjudligi ? 'Mavjud' : 'Qolmagan'}
          </span>
        </div>
      </div>

      {!isLast && <div className="pointer-events-none absolute inset-x-[13px] bottom-0 h-px bg-black/10" />}
    </motion.div>
  )
}

function FoodList({ foods }) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-black/10 bg-white">
      {foods.map((food, index) => (
        <FoodRow key={food.id} food={food} isLast={index === foods.length - 1} />
      ))}
    </div>
  )
}

export default function App() {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [swipeDirection, setSwipeDirection] = useState(0)
  const [catalogEdgeShadow, setCatalogEdgeShadow] = useState({ left: false, right: false })
  const searchRef = useRef(null)
  const categoryScrollRef = useRef(null)
  const categoryChipRefs = useRef([])
  const catalogSwipeStart = useRef({ x: 0, y: 0, active: false, locked: false })

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
  const categoryButtons = ['Barchasi', ...categories]
  const searchResults = query.trim() ? Object.values(groupedFoods).flat() : []
  const activeCategoryIndex = selectedCategory ? categories.indexOf(selectedCategory) + 1 : 0
  const activeCategoryLabel = selectedCategory ?? 'Barchasi'
  const activeFoods = selectedCategory ? groupedFoods[selectedCategory] ?? [] : Object.values(groupedFoods).flat()

  const selectCategoryByIndex = (nextIndex) => {
    if (nextIndex === activeCategoryIndex) return
    const nextLabel = categoryButtons[nextIndex]
    if (!nextLabel) return
    setSwipeDirection(nextIndex > activeCategoryIndex ? 1 : -1)
    setSelectedCategory(nextLabel === 'Barchasi' ? null : nextLabel)
  }

  const moveCategory = (step) => {
    const nextIndex = Math.max(0, Math.min(categoryButtons.length - 1, activeCategoryIndex + step))
    if (nextIndex === activeCategoryIndex) return
    selectCategoryByIndex(nextIndex)
  }

  const onCatalogPointerDown = (event) => {
    if (query.trim()) return
    catalogSwipeStart.current = {
      x: event.clientX,
      y: event.clientY,
      active: true,
      locked: false
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const onCatalogPointerMove = (event) => {
    const state = catalogSwipeStart.current
    if (!state.active) return

    const dx = event.clientX - state.x
    const dy = event.clientY - state.y

    if (!state.locked && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
      state.locked = true
    }
  }

  const onCatalogPointerUp = (event) => {
    const state = catalogSwipeStart.current
    if (!state.active) return

    const dx = event.clientX - state.x
    const dy = event.clientY - state.y
    if (state.locked && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) {
        setSwipeDirection(1)
        moveCategory(1)
      } else {
        setSwipeDirection(-1)
        moveCategory(-1)
      }
    }

    catalogSwipeStart.current = { x: 0, y: 0, active: false, locked: false }
  }

  useEffect(() => {
    const element = categoryScrollRef.current
    if (!element || query.trim()) {
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
  }, [query])

  useEffect(() => {
    if (query.trim()) return
    const activeChip = categoryChipRefs.current[activeCategoryIndex]
    activeChip?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center'
    })
  }, [activeCategoryIndex, query])

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="min-h-screen bg-white p-3 text-slate-900 overflow-x-hidden *:selection:bg-[#1bac4b33] *:selection:text-[#1bac4b]"
    >
      <section className="mx-auto max-w-7xl">
        <motion.div
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="mb-4 px-1"
        >
          <div className="flex w-full flex-col items-center">
            <a href="/" className='cursor-pointer'><img
              src="/logo-tr.png"
              alt="Rayhon logotipi"
              className="!h-[80px] w-full max-w-[220px]  object-cover"
            /></a>
            <p className="text-[#1bac4b] leading-none">taomlari menyusi</p>
          </div>
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
          className="mb-4 rounded-[26px] border border-[#1bac4b33] bg-white px-4 py-2.5 focus-within:ring-1 ring-[#1bac4b] group transition outline-[#1bac4b]"
         >
          <div className="flex items-center gap-3">
            <Search className="size-5 shrink-0 text-[#18714776] group-focus-within:text-[#1bac4b]" />
            <Input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Qidirish..."
              className="h-7 border-0 bg-transparent px-0 text-[15px] text-slate-900 placeholder:text-slate-500 focus-visible:ring-0"
            />
          </div>
        </div>

        {!query.trim() && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="relative mb-4"
          >
            <div
              className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-white to-transparent transition-opacity duration-200 ${
                catalogEdgeShadow.left ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <div
              className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white to-transparent transition-opacity duration-200 ${
                catalogEdgeShadow.right ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <div
              ref={categoryScrollRef}
              className="flex gap-2 overflow-x-auto pb-1 no-scrollbar"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {categoryButtons.map((category, index) => {
                const Icon = category === 'Barchasi' ? Beef : getCategoryIcon(category)
                const isActive = index === activeCategoryIndex
                return (
                  <button
                    key={category}
                    ref={(element) => {
                      categoryChipRefs.current[index] = element
                    }}
                    type="button"
                    onClick={() => selectCategoryByIndex(index)}
                    className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur transition duration-200 outline-[#1bac4b] ${
                      isActive
                        ? 'border-[#1bac4b] bg-[#1bac4b] text-white'
                        : 'border-black/10 bg-white/80 text-slate-700 hover:bg-white'
                    }`}
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
              <FoodList foods={searchResults} />
            ) : (
              <div className="rounded-2xl bg-white px-4 py-8 text-center text-sm font-medium text-slate-500">
                Taomlar topilmadi
              </div>
            )}
          </motion.section>
        ) : (
          <motion.section
            key={activeCategoryLabel}
            initial={{ opacity: 0, x: swipeDirection >= 0 ? 18 : -18, y: 6 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: swipeDirection >= 0 ? -12 : 12, y: -4 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="space-y-3 touch-pan-y"
            onPointerDown={onCatalogPointerDown}
            onPointerMove={onCatalogPointerMove}
            onPointerUp={onCatalogPointerUp}
            onPointerCancel={onCatalogPointerUp}
          >
            <div className="px-1">
              <h2 className="text-lg font-semibold text-slate-900">
                {selectedCategory ? selectedCategory : 'Barcha taomlar'}
              </h2>
              <p className="text-xs text-slate-500">{activeFoods.length} ta taom</p>
            </div>
            <FoodList foods={activeFoods} />
          </motion.section>
        )}
        </AnimatePresence>
      </section>
    </motion.main>
  )
}
