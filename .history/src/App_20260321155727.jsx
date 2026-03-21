import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Beef,
  CakeSlice,
  Fish,
  Leaf,
  Sandwich,
  Search,
  Soup,
  Wine,
  X
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import foods from './foods.json'

const FALLBACK_IMAGE = '/img-nf.png'

const TOKEN_SYNONYMS = {
  palov: ['plov', 'osh'],
  plov: ['palov', 'osh'],
  osh: ['palov', 'plov'],
  somsa: ['samsa'],
  samsa: ['somsa'],
  manti: ['mantu'],
  kabob: ['kebab'],
  shashlik: ['kebab'],
  kebab: ['kabob', 'shashlik']
}

function normalizeText(value = '') {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ʼ'‘’`]/g, '')
    .replace(/ё/g, 'e')
    .replace(/ў/g, 'o')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenizeQuery(value) {
  return normalizeText(value)
    .split(' ')
    .filter(Boolean)
}

function getTokenVariants(token) {
  const variants = new Set([token])
  const synonymList = TOKEN_SYNONYMS[token]
  if (synonymList) {
    synonymList.forEach((item) => variants.add(item))
  }
  return Array.from(variants)
}

function scoreFoodMatch(fields, tokens) {
  let score = 0

  for (const token of tokens) {
    const variants = getTokenVariants(token)
    let tokenScore = 0

    variants.forEach((variant) => {
      if (fields.name.startsWith(variant)) tokenScore = Math.max(tokenScore, 6)
      else if (fields.name.includes(variant)) tokenScore = Math.max(tokenScore, 4)

      if (fields.category.startsWith(variant)) tokenScore = Math.max(tokenScore, 3)
      else if (fields.category.includes(variant)) tokenScore = Math.max(tokenScore, 2)

      if (fields.ingredients.includes(variant)) tokenScore = Math.max(tokenScore, 1)
      if (fields.availability.includes(variant)) tokenScore = Math.max(tokenScore, 1)
      if (fields.price.includes(variant)) tokenScore = Math.max(tokenScore, 1)
    })

    if (!tokenScore) return null
    score += tokenScore
  }

  score += Math.min(3, tokens.length)
  return score
}

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

function FoodRow({ food, isLast, animate = true }) {
  const Wrapper = animate ? motion.div : 'div'
  const motionProps = animate
    ? {
        layout: true,
        initial: { opacity: 0, y: 10 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: false, amount: 0.2 },
        transition: { duration: 0.28, ease: 'easeOut' }
      }
    : {}

  return (
    <Wrapper
      {...motionProps}
      className="relative flex gap-3 px-[13px] py-3.5 overflow-hidden"
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
        <p className="mt-1 truncate text-xs leading-5 text-slate-500">{food.tarkibi}</p>
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <span className="flex items-baseline gap-2 text-[16px] font-bold leading-none text-slate-900">
            {formatPrice(food.narxi)} so'm
            <span className="text-xs font-medium text-slate-500">/ 1 porsiya</span>
          </span>
          <button
            type="button"
            onClick={() => food.onOpenDetails?.(food)}
            disabled={!food.mavjudligi}
            className={`text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1bac4b] ${
              food.mavjudligi
                ? 'text-[#1bac4b] hover:text-emerald-600'
                : 'text-slate-400 cursor-not-allowed'
            }`}
          >
            Batafsil
          </button>
        </div>
      </div>

      {!food.mavjudligi && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-white/70 backdrop-blur-[2px] flex items-center justify-center text-sm font-semibold text-slate-700">
          Taom qolmagan
        </div>
      )}

      {!isLast && <div className="pointer-events-none absolute inset-x-[13px] bottom-0 h-px bg-black/10" />}
    </Wrapper>
  )
}

function FoodList({ foods, animate = true }) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-black/10 bg-white">
      {foods.map((food, index) => (
        <FoodRow
          key={food.id}
          food={food}
          isLast={index === foods.length - 1}
          animate={animate}
        />
      ))}
    </div>
  )
}

function SearchResultsList({ foods }) {
  return (
    <ul className="overflow-hidden rounded-[22px] border border-black/10 bg-white divide-y divide-black/10">
      {foods.map((food) => (
        <li key={food.id} className="relative px-4 py-3">
          <div className={`flex items-center gap-3 ${food.mavjudligi ? '' : 'blur-[1px] opacity-70'}`}>
            <span className="text-sm font-semibold text-slate-900 truncate">{food.nomi}</span>
            <span className="text-sm text-slate-300">|</span>
            <span className="text-sm font-semibold text-[#1bac4b] whitespace-nowrap">
              {formatPrice(food.narxi)} so'm
            </span>
            <button
              type="button"
              onClick={() => food.onOpenDetails?.(food)}
              disabled={!food.mavjudligi}
              className={`ml-auto text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1bac4b] ${
                food.mavjudligi
                  ? 'text-[#1bac4b] hover:text-emerald-600'
                  : 'text-slate-400 cursor-not-allowed'
              }`}
            >
              Batafsil
            </button>
          </div>
          {!food.mavjudligi && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-700">
              Taom qolmagan
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}

export default function App() {
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [swipeDirection, setSwipeDirection] = useState(0)
  const [catalogEdgeShadow, setCatalogEdgeShadow] = useState({ left: false, right: false })
  const [detailFood, setDetailFood] = useState(null)
  const [detailSlide, setDetailSlide] = useState(0)
  const searchRef = useRef(null)
  const categoryScrollRef = useRef(null)
  const categoryChipRefs = useRef([])
  const catalogSwipeStart = useRef({ x: 0, y: 0, active: false, locked: false })
  const searchBlurTimeout = useRef(null)
  const searchContainerRef = useRef(null)

  const searchIndex = useMemo(
    () =>
      foods.map((food) => ({
        food,
        fields: {
          name: normalizeText(food.nomi),
          ingredients: normalizeText(food.tarkibi),
          category: normalizeText(food.kategoriya),
          availability: food.mavjudligi ? 'mavjud' : 'qolmagan',
          price: String(food.narxi)
        }
      })),
    [foods]
  )

  const { groupedFoods, searchResults } = useMemo(() => {
    const tokens = tokenizeQuery(query)

    if (!tokens.length) {
      const groups = foods.reduce((acc, food) => {
        if (!acc[food.kategoriya]) acc[food.kategoriya] = []
        acc[food.kategoriya].push(food)
        return acc
      }, {})

      return { groupedFoods: groups, searchResults: [] }
    }

    const matches = []

    searchIndex.forEach((item) => {
      const matchScore = scoreFoodMatch(item.fields, tokens)
      if (matchScore !== null) {
        matches.push({ food: item.food, score: matchScore })
      }
    })

    matches.sort(
      (a, b) => b.score - a.score || a.food.nomi.localeCompare(b.food.nomi, 'uz', { sensitivity: 'base' })
    )

    const grouped = matches.reduce((acc, { food }) => {
      if (!acc[food.kategoriya]) acc[food.kategoriya] = []
      acc[food.kategoriya].push(food)
      return acc
    }, {})

    return { groupedFoods: grouped, searchResults: matches.map((entry) => entry.food) }
  }, [query, searchIndex])

  const categories = Object.keys(groupedFoods)
  const categoryButtons = ['Barchasi', ...categories]
  const activeCategoryIndex = selectedCategory ? categories.indexOf(selectedCategory) + 1 : 0
  const activeCategoryLabel = selectedCategory ?? 'Barchasi'
  const activeFoods = selectedCategory ? groupedFoods[selectedCategory] ?? [] : Object.values(groupedFoods).flat()
  const attachDetailHandler = (list) => list.map((item) => ({ ...item, onOpenDetails: setDetailFood }))
  const searchActive = searchOpen || Boolean(query)

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

  useEffect(() => {
    if (detailFood) setDetailSlide(0)
  }, [detailFood])

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
          <div className="flex w-full flex-col items-center !h-[80px]">
            <a href="/" className='cursor-pointer w-full mx-auto'>
            <img
              src="/logo.png"
              alt="Rayhon logotipi"
              className=" w-full max-w-[220px] object-cover"
            /></a>
            <p className="text-[#1bac4b] leading-none">taomlari menyusi</p>
          </div>
        </motion.div>

        <div className="sticky top-0 z-20 mb-4 bg-white pb-2">
          <div className="relative">
            {searchActive && (
              <div className="mb-2">
                <div className="group flex items-center gap-2 rounded-full border border-[#1bac4b33] bg-white px-4 py-2.5 ring-1 ring-[#1bac4b] shadow-sm cursor-text">
                  <Search className="size-5 text-[#18714776] group-focus-within:text-[#1bac4b]" />
                  <Input
                    ref={searchRef}
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value)
                      setSearchOpen(true)
                    }}
                    onFocus={() => setSearchOpen(true)}
                    onBlur={() => {
                      clearTimeout(searchBlurTimeout.current)
                      searchBlurTimeout.current = setTimeout(() => {
                        if (!query) setSearchOpen(false)
                      }, 120)
                    }}
                    placeholder="Qidirish..."
                    className="h-7 border-0 !bg-transparent px-0 text-[15px] text-slate-900 placeholder:text-slate-500 focus-visible:ring-0 flex-1"
                  />
                  {query && (
                    <button
                      type="button"
                      aria-label="Qidiruvni tozalash"
                      onClick={(event) => {
                        event.stopPropagation()
                        setQuery('')
                        searchRef.current?.focus()
                      }}
                      className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1bac4b]"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="relative flex items-center gap-2"
            >
              <div
                className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-white to-transparent transition-opacity duration-200  ${
                  catalogEdgeShadow.left ? 'opacity-100' : 'opacity-0'
                }`}
              />
              <div
                className={`pointer-events-none absolute inset-y-0 ${searchActive ? 'right-0' : 'right-10'} z-10 w-8 bg-gradient-to-l from-white to-transparent transition-opacity duration-200 ${
                  catalogEdgeShadow.right ? 'opacity-100' : 'opacity-0'
                }`}
              />
              <div
                ref={categoryScrollRef}
                className="flex flex-1 items-center gap-2 overflow-x-auto pb-1 pr-4 no-scrollbar mt-2"
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

              {!searchActive && (
                <button
                  type="button"
                  aria-label="Qidirish"
                  onClick={() => {
                    setSearchOpen(true)
                    requestAnimationFrame(() => searchRef.current?.focus())
                  }}
                  className="shrink-0 rounded-full border border-[#1bac4b33] bg-white p-2 shadow-sm transition-all duration-200 hover:border-[#1bac4b66] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1bac4b]"
                >
                  <Search className="size-5 text-[#18714776]" />
                </button>
              )}
            </motion.div>
          </div>
        </div>

        {query.trim() ? (
          <section className="space-y-3">
            {searchResults.length > 0 ? (
              <>
                <div className="px-1">
                  <h2 className="text-lg font-semibold text-slate-900">Qidiruv natijalari</h2>
                  <p className="text-sm text-slate-500">{searchResults.length} ta taom topildi</p>
                </div>
                <SearchResultsList foods={attachDetailHandler(searchResults)} />
              </>
            ) : (
              <div className="rounded-2xl bg-white px-4 py-8 text-center text-sm font-medium text-slate-500">
                Taomlar topilmadi
              </div>
            )}
          </section>
        ) : (
          <motion.section
            key={activeCategoryLabel}
            initial={{ opacity: 0, x: swipeDirection >= 0 ? 8 : -8, y: 4 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
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
            <FoodList foods={attachDetailHandler(activeFoods)} />
          </motion.section>
        )}
      </section>

      {detailFood && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <div className="relative">
              <img
                src={(detailFood.galereya ?? [detailFood.rasm])[detailSlide % (detailFood.galereya?.length ?? 1)]}
                alt={detailFood.nomi}
                onError={(event) => {
                  event.currentTarget.onerror = null
                  event.currentTarget.src = FALLBACK_IMAGE
                }}
                className="h-64 w-full object-cover"
              />
              <div className="absolute inset-x-0 top-0 flex justify-between p-3">
                <button
                  type="button"
                  className="rounded-full bg-black/60 p-2 text-white backdrop-blur focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  onClick={() => setDetailFood(null)}
                  aria-label="Yopish"
                >
                  <X className="size-4" />
                </button>
                {(detailFood.galereya?.length ?? 1) > 1 && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-full bg-black/60 px-3 py-2 text-white text-sm font-semibold"
                      onClick={() =>
                        setDetailSlide((prev) => (prev - 1 + detailFood.galereya.length) % detailFood.galereya.length)
                      }
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      className="rounded-full bg-black/60 px-3 py-2 text-white text-sm font-semibold"
                      onClick={() => setDetailSlide((prev) => (prev + 1) % detailFood.galereya.length)}
                    >
                      ›
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{detailFood.nomi}</h3>
                  <p className="mt-1 text-sm text-slate-500">{detailFood.kategoriya}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-[#1bac4b]">{formatPrice(detailFood.narxi)} so'm</div>
                  <div className="text-xs text-slate-500">1 porsiya</div>
                </div>
              </div>
              <p className="text-sm leading-6 text-slate-700">{detailFood.tarkibi}</p>
            </div>
          </motion.div>
        </div>
      )}
    </motion.main>
  )
}
