import { memo, useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Beef,
  CakeSlice,
  ChevronLeft,
  ChevronRight,
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

function sanitizeGallery(list = []) {
  return list
    .map((url) => (typeof url === 'string' ? url.trim() : ''))
    .filter(
      (url) =>
        url &&
        (url.startsWith('http://') ||
          url.startsWith('https://') ||
          url.startsWith('/') ||
          url.startsWith('./') ||
          url.startsWith('../'))
    )
}

function getGallery(food) {
  const fromArray = sanitizeGallery(food?.rasmlar)
  if (fromArray.length) return fromArray
  if (food?.rasm) return [food.rasm]
  return [FALLBACK_IMAGE]
}

function getMainImage(food) {
  return getGallery(food)[0] || FALLBACK_IMAGE
}

function ImageWithLoader({ src, alt, className, fallback = FALLBACK_IMAGE, ...rest }) {
  const [loading, setLoading] = useState(Boolean(src))
  const [currentSrc, setCurrentSrc] = useState(src)
  const imgRef = useRef(null)

  useEffect(() => {
    setCurrentSrc(src)
    setLoading(Boolean(src))
  }, [src])

  useEffect(() => {
    const img = imgRef.current
    if (img && img.complete && img.naturalWidth > 0) {
      setLoading(false)
    }
  }, [currentSrc])

  return (
    <div className="relative overflow-hidden rounded-[12px]">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 backdrop-blur-sm rounded-[12px]">
          <div className="h-6 w-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        </div>
      )}
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        className={`${className} ${loading ? 'blur-[2px] opacity-80' : 'blur-0 opacity-100'} transition-[filter,opacity] duration-250 rounded-[12px]`}
        onLoad={() => setLoading(false)}
        onError={(event) => {
          if (currentSrc !== fallback) {
            setCurrentSrc(fallback)
            setLoading(true)
          } else {
            setLoading(false)
          }
        }}
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        loading="lazy"
        {...rest}
      />
    </div>
  )
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
      <ImageWithLoader
        src={getMainImage(food)}
        alt={food.nomi}
        className="h-[84px] w-[84px] shrink-0 rounded-2xl object-cover"
      />

      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold leading-5 text-slate-900">{food.nomi}</div>
        <p className="mt-1 truncate text-xs leading-5 text-slate-500">{food.tarkibi}</p>
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <span className="flex items-baseline gap-2 text-[16px] font-bold leading-none text-slate-900">
            {formatPrice(food.narxi)} so'm
            <span className="text-xs font-medium text-slate-500">/ {food["o'lchov"] || '1 porsiya'}</span>
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

const FoodList = memo(function FoodList({ foods, animate = true }) {
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
})

function SearchResultsList({ foods }) {
  return (
    <ul className="overflow-hidden rounded-[22px] border border-black/10 bg-white divide-y divide-black/10">
      {foods.map((food) => (
        <li key={food.id} className="relative px-4 py-3 flex items-center">
          {!food.mavjudligi && (
            <div className="absolute inset-0 flex items-center justify-center pl-2 text-xs font-semibold text-[14px]  
            ">
              <span className='px-2 py-1.5 rounded-full'>Taom qolmagan</span>
            </div>
          )}
          <div
            className={`w-full grid grid-cols-[minmax(0,1fr)_auto_auto_auto_auto] items-center gap-3 ${
              food.mavjudligi ? '' : 'blur-[1.5px] opacity-30'
            }`}
          >
            <span className="text-sm font-semibold text-slate-900 truncate">{food.nomi}</span>
            <span className="text-sm text-slate-300">|</span>
            <span className="text-sm font-semibold text-[#1bac4b] whitespace-nowrap">
              {formatPrice(food.narxi)} so'm
            </span>
            <span className="text-sm text-slate-300">|</span>
            <button
              type="button"
              onClick={() => food.onOpenDetails?.(food)}
              disabled={!food.mavjudligi}
              className={`text-xs font-semibold ${
                food.mavjudligi ? 'text-[#1bac4b] hover:text-emerald-600' : 'text-slate-400 cursor-not-allowed'
              }`}
            >
              Batafsil
            </button>
          </div>
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
  const slideSwipe = useRef({ start: 0, last: 0, active: false, id: null })

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

  const onSlidePointerDown = (event) => {
    const x = event.clientX
    slideSwipe.current = { start: x, last: x, active: true, id: event.pointerId ?? null }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const onSlidePointerMove = (event) => {
    const state = slideSwipe.current
    if (!state.active) return
    if (state.id !== null && event.pointerId !== state.id) return
    slideSwipe.current.last = event.clientX
    event.preventDefault()
  }

  const onSlidePointerUp = (event, total) => {
    const state = slideSwipe.current
    if (!state.active) return
    if (state.id !== null && event.pointerId !== state.id) return
    const dx = (event.clientX ?? state.last) - state.start
    const threshold = 20
    if (Math.abs(dx) > threshold) {
      setDetailSlide((prev) => (dx < 0 ? (prev + 1) % total : (prev - 1 + total) % total))
    }
    slideSwipe.current = { start: 0, last: 0, active: false, id: null }
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="min-h-screen bg-white p-3 text-slate-900 *:selection:bg-[#1bac4b33] *:selection:text-[#1bac4b]"
    >
      <section className="mx-auto max-w-7xl">
        <motion.div
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="mb-4 px-1"
        >
<div className="w-full flex flex-col items-center justify-center py-6 gap-2">
  
  <a href="/" className="mx-auto max-h-[70px] flex items-center justify-center">
    <img
      src="/logo.png"
      alt="Rayhon logotipi"
      className="w-full h-full pointer-events-none"
    />
  </a>

  <p className="text-[#1bac4b] text-sm sm:text-base md:text-lg leading-none">
    taomlari menyusi
  </p>

</div>
        </motion.div>

        <div className="!sticky !top-[0px] z-30 mb-4 py-2 pb-2 bg-white">
          <div className="relative">
            <AnimatePresence initial={false}>
              {searchActive && (
                <motion.div
                  key="search-bar"
                  layout
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.32, ease: 'easeInOut' }}
                  className="mb-2"
                >
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
                </motion.div>
              )}
            </AnimatePresence>

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
                className={`pointer-events-none absolute inset-y-0 ${searchActive ? 'right-0' : 'right-10'} z-10 w-8 bg-gradient-to-l from-white to-[#fff3] transition-opacity duration-200 ${
                  catalogEdgeShadow.right ? 'opacity-100' : 'opacity-0'
                }`}
              />
              <div
                ref={categoryScrollRef}
                className="flex flex-1 items-center gap-2 overflow-x-auto pb-1 no-scrollbar mt-1.5"
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
                      className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur transition-[background] duration-200 outline-[#1bac4b] ${
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

              <div className="flex items-center gap-[15px] shrink-0 pl-1">
                {!searchActive && <div className="h-6 w-px bg-black/10" />}
                {!searchActive && (
                  <button
                    type="button"
                    aria-label="Qidirish"
                    onClick={() => {
                      setSearchOpen(true)
                      requestAnimationFrame(() => searchRef.current?.focus())
                    }}
                    className="shrink-0 rounded-full border border-[#1bac4b33] bg-white p-2 shadow-sm transition-all duration-200 hover:border-[#1bac4b66] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1bac4b] active:bg-[#1bac4b1c]"
                  >
                    <Search className="size-5 text-[#18714776]" />
                  </button>
                )}
              </div>
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
            {(() => {
              const gallery = getGallery(detailFood)
              const total = gallery.length || 1

              return (
                <>
            <div
              className="relative touch-pan-y"
              onPointerDown={onSlidePointerDown}
              onPointerMove={onSlidePointerMove}
              onPointerUp={(e) => onSlidePointerUp(e, total)}
            >
              <ImageWithLoader
                src={gallery[detailSlide % total]}
                alt={detailFood.nomi}
                className="h-64 w-full object-cover"
              />
              {total > 1 && (
                <div className="pointer-events-none absolute inset-0 flex items-stretch justify-between">
                  <button
                    type="button"
                    aria-label="Oldingi rasm"
                    onClick={() => setDetailSlide((prev) => (prev - 1 + total) % total)}
                    className="pointer-events-auto group flex flex-1 items-center justify-start bg-gradient-to-r from-transparent via-transparent to-transparent hover:from-black/15 hover:via-black/0 hover:to-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    <ChevronLeft className="mx-3 h-6 w-6 text-white/0 group-hover:text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] transition-opacity duration-150" />
                  </button>
                  <button
                    type="button"
                    aria-label="Keyingi rasm"
                    onClick={() => setDetailSlide((prev) => (prev + 1) % total)}
                    className="pointer-events-auto group flex flex-1 items-center justify-end bg-gradient-to-l from-transparent via-transparent to-transparent hover:from-black/15 hover:via-black/0 hover:to-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    <ChevronRight className="mx-3 h-6 w-6 text-white/0 group-hover:text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] transition-opacity duration-150" />
                  </button>
                </div>
              )}
              <div className="absolute inset-x-0 top-0 flex justify-end p-3">
                <button
                  type="button"
                  className="rounded-full bg-black/60 p-2 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ml-auto"
                  onClick={() => setDetailFood(null)}
                  aria-label="Yopish"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
              {total > 1 && (
                <div className="flex items-center justify-center gap-2 py-2">
                  {gallery.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setDetailSlide(idx)}
                      className={`h-2.5 w-2.5 rounded-full transition-all ${
                        idx === detailSlide % total ? 'bg-[#1bac4b]' : 'bg-slate-300'
                      }`}
                      aria-label={`Rasm ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
                </>
              )
            })()}

            <div className="space-y-3 px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{detailFood.nomi}</h3>
                  <p className="mt-1 text-sm text-slate-500">{detailFood.kategoriya}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-[#1bac4b]">{formatPrice(detailFood.narxi)} so'm</div>
                  <div className="text-xs text-slate-500">{detailFood["o'lchov"] || '1 porsiya'}</div>
                </div>
              </div>
              <p className="text-sm leading-4 text-slate-700">{detailFood.tarkibi}</p>
            </div>
          </motion.div>
        </div>
      )}
    </motion.main>
  )
}
