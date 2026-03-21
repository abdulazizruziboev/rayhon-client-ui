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
  X,
  ChevronRight as ChevronRightIcon
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import foods from './foods.json'
import { useAnimation, useMotionValue } from 'framer-motion'

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

function getDiscountInfo(food) {
  const raw = food?.chegirma
  if (!raw) return { hasDiscount: false, oldPrice: food.narxi, newPrice: food.narxi, percent: 0 }
  const parsed = parseFloat(String(raw).replace('%', ''))
  if (Number.isNaN(parsed) || parsed <= 0) {
    return { hasDiscount: false, oldPrice: food.narxi, newPrice: food.narxi, percent: 0 }
  }
  const newPrice = Math.max(0, Math.round(food.narxi * (1 - parsed / 100)))
  return {
    hasDiscount: true,
    oldPrice: food.narxi,
    newPrice,
    percent: parsed
  }
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
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-[12px]">
          <div
            className="h-7 w-7 rounded-full border-[3px] border-white/70 border-t-[#1bac4b] border-b-[#1bac4b] animate-[spin_0.9s_linear_infinite] shadow-[0_0_0_1px_rgba(0,0,0,0.04)]"
            aria-label="Yuklanmoqda"
          />
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
        transition: { duration: 0.48, ease: 'easeOut' } // duration increased
      }
    : {}

  return (
    <Wrapper
      {...motionProps}
      role={food.mavjudligi ? 'button' : undefined}
      tabIndex={food.mavjudligi ? 0 : -1}
      onClick={() => food.mavjudligi && food.onOpenDetails?.(food)}
      onKeyDown={(e) => {
        if (!food.mavjudligi) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          food.onOpenDetails?.(food)
        }
      }}
      className={`relative flex gap-3 px-[13px] py-3.5 overflow-hidden ${food.mavjudligi ? 'cursor-pointer' : 'cursor-default'}`}
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
          {(() => {
            const { hasDiscount, oldPrice, newPrice } = getDiscountInfo(food)
            return (
              <span className="flex items-baseline gap-2 leading-none">
                <span className={`text-[16px] font-bold ${hasDiscount ? 'text-[#1bac4b]' : 'text-slate-900'}`}>
                  {formatPrice(hasDiscount ? newPrice : oldPrice)} so'm
                </span>
                <span className="text-xs font-medium text-slate-500">/ {food["o'lchov"] || '1 porsiya'}</span>
                {hasDiscount && (
                  <span className="text-xs font-semibold text-slate-400 line-through">
                    {formatPrice(oldPrice)} so'm
                  </span>
                )}
              </span>
            )
          })()}
          <button
            type="button"
            aria-label="Batafsil ko'rish"
            onClick={(e) => {
              e.stopPropagation()
              food.onOpenDetails?.(food)
            }}
            disabled={!food.mavjudligi}
            className={`flex items-center justify-center rounded-full p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1bac4b] ${
              food.mavjudligi
                ? 'text-[#1bac4b] hover:text-emerald-600'
                : 'text-slate-300 cursor-not-allowed'
            }`}
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {(() => {
        const { hasDiscount, percent } = getDiscountInfo(food)
        if (!hasDiscount) return null
        return (
          <div className="pointer-events-none absolute right-3 top-3 z-10 rounded-full bg-rose-50 px-2.5 py-1 text-[12px] font-semibold text-rose-500 shadow-sm">
            -{percent}%
          </div>
        )
      })()}

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
        <li
          key={food.id}
          className="relative px-4 py-3 flex items-center cursor-pointer"
          onClick={() => food.mavjudligi && food.onOpenDetails?.(food)}
        >
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
            {(() => {
              const { hasDiscount, oldPrice, newPrice } = getDiscountInfo(food)
              return (
                <span className="flex items-center gap-1 whitespace-nowrap">
                  <span className={`text-sm font-semibold ${hasDiscount ? 'text-[#1bac4b]' : 'text-slate-900'}`}>
                    {formatPrice(hasDiscount ? newPrice : oldPrice)} so'm
                  </span>
                  {hasDiscount && (
                    <span className="text-[11px] text-slate-400 line-through">{formatPrice(oldPrice)}</span>
                  )}
                </span>
              )
            })()}
            <span className="text-sm text-slate-300">|</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                food.onOpenDetails?.(food)
              }}
              disabled={!food.mavjudligi}
              aria-label="Batafsil ko'rish"
              className={`flex items-center justify-center rounded-full p-2 ${
                food.mavjudligi ? 'text-[#1bac4b] hover:text-emerald-600' : 'text-slate-300 cursor-not-allowed'
              }`}
            >
              <ChevronRightIcon className="h-4 w-4" />
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
  const [dragY, setDragY] = useState(0)
  const [dragProgress, setDragProgress] = useState(0)

  const searchRef = useRef(null)
  const categoryScrollRef = useRef(null)
  const categoryChipRefs = useRef([])
  const catalogSwipeStart = useRef({ x: 0, y: 0, active: false, locked: false })
  const searchBlurTimeout = useRef(null)

  const slideSwipe = useRef({ startX: 0, startY: 0, lastX: 0, lastY: 0, active: false, id: null })
  const pageSwipe = useRef({ startY: 0, lastY: 0, active: false, id: null })
  const openDetailPage = useCallback((food) => {
    if (!food?.mavjudligi) return
    const url = new URL(window.location.href)
    if (url.searchParams.get('food') !== String(food.id)) {
      url.searchParams.set('food', food.id)
      window.history.pushState({ foodId: food.id }, '', url)
    }
    setDetailFood(food)
  }, [])

  const closeDetailPage = useCallback(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.has('food')) {
      if (window.history.state && window.history.state.foodId) {
        window.history.back()
      } else {
        const url = new URL(window.location.href)
        url.searchParams.delete('food')
        window.history.replaceState({}, '', url)
        setDetailFood(null)
      }
    } else {
      setDetailFood(null)
    }
  }, [])

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
  const attachDetailHandler = (list) => list.map((item) => ({ ...item, onOpenDetails: openDetailPage }))
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

  // Qo'shildi / O'zgartirildi: global catalog swipe handlers (start anywhere)
  const onCatalogPointerDown = (event) => {
    // Ignore when search active or detail open
    if (query.trim() || detailFood) return
    // Only ignore text inputs and gallery (allow buttons/links)
    if (event.target.closest('input, textarea, [data-gallery]')) return

    const x = event.clientX
    const y = event.clientY
    catalogSwipeStart.current = {
      x,
      y,
      lastX: x,
      lastY: y,
      active: true,
      locked: false,
      id: event.pointerId
    }
    // capture pointer on the main element so we continue receiving moves
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const onCatalogPointerMove = (event) => {
    const state = catalogSwipeStart.current
    if (!state.active) return
    // ensure same pointer
    if (state.id != null && event.pointerId !== state.id) return

    const dx = event.clientX - state.x
    const dy = event.clientY - state.y
    state.lastX = event.clientX
    state.lastY = event.clientY

    // if not locked yet, detect horizontal intent
    if (!state.locked) {
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
        state.locked = true
      } else if (Math.abs(dy) > 20 && Math.abs(dy) > Math.abs(dx)) {
        // stronger vertical intent — bail out (do not lock horizontal)
        state.active = false
        try { event.currentTarget.releasePointerCapture?.(event.pointerId) } catch (e) {}
      }
    }
    // do not call preventDefault — allow vertical scroll
  }

  const onCatalogPointerUp = (event) => {
    const state = catalogSwipeStart.current
    if (!state.active) {
      // cleanup anyway if pointer belongs to us
      if (state.id != null && event.pointerId === state.id) {
        catalogSwipeStart.current = { x: 0, y: 0, active: false, locked: false }
      }
      return
    }
    // ensure same pointer
    if (state.id != null && event.pointerId !== state.id) return

    const dx = (event.clientX ?? state.lastX) - state.x
    const dy = (event.clientY ?? state.lastY) - state.y
    const threshold = 60

    if (state.locked && Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) {
        setSwipeDirection(1)
        moveCategory(1)
      } else {
        setSwipeDirection(-1)
        moveCategory(-1)
      }
    }

    // cleanup
    catalogSwipeStart.current = { x: 0, y: 0, active: false, locked: false }
    try { event.currentTarget.releasePointerCapture?.(event.pointerId) } catch (e) {}
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

  useEffect(() => {
    const syncWithUrl = () => {
      const params = new URLSearchParams(window.location.search)
      const foodId = params.get('food')
      if (foodId) {
        const found = foods.find((f) => String(f.id) === String(foodId))
        setDetailFood(found || null)
      } else {
        setDetailFood(null)
      }
    }
    syncWithUrl()
    window.addEventListener('popstate', syncWithUrl)
    return () => window.removeEventListener('popstate', syncWithUrl)
  }, [])

  const onSlidePointerDown = (event) => {
    if (event.target?.closest?.('[data-slide-control]')) return
    const x = event.clientX
    const y = event.clientY
    slideSwipe.current = { startX: x, startY: y, lastX: x, lastY: y, active: true, id: event.pointerId ?? null }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const onSlidePointerMove = (event) => {
    const state = slideSwipe.current
    if (!state.active) return
    if (state.id !== null && event.pointerId !== state.id) return
    slideSwipe.current.lastX = event.clientX
    slideSwipe.current.lastY = event.clientY
    event.preventDefault()
  }

  const onSlidePointerUp = (event, total) => {
    const state = slideSwipe.current
    if (!state.active) return
    if (state.id !== null && event.pointerId !== state.id) return
    const dx = (event.clientX ?? state.lastX) - state.startX
    const dy = (event.clientY ?? state.lastY) - state.startY
    const thresholdX = 50
    const thresholdY = 100
    
    if (Math.abs(dy) > Math.abs(dx) && dy > thresholdY) {
      closeDetailPage()
    } else if (Math.abs(dx) > thresholdX && Math.abs(dx) > Math.abs(dy)) {
      setDetailSlide((prev) => (dx < 0 ? (prev + 1) % total : (prev - 1 + total) % total))
    }
    
    setDragY(0)
    setDragProgress(0)
    slideSwipe.current = { startX: 0, startY: 0, lastX: 0, lastY: 0, active: false, id: null }
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }} // slowed
      className="min-h-screen flex flex-col bg-white p-3 text-slate-900 *:selection:bg-[#1bac4b33] *:selection:text-[#1bac4b]"
      style={{ touchAction: 'manipulation' }} // allow native vertical scroll and horizontal gestures
      onPointerDown={onCatalogPointerDown}
      onPointerMove={onCatalogPointerMove}
      onPointerUp={onCatalogPointerUp}
      onPointerCancel={onCatalogPointerUp}
    >
      {detailFood ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }} // slowed detail enter
          className="mx-auto max-w-7xl"
          style={{
            opacity: Math.max(0.3, 1 - Math.abs(dragProgress) * 0.3)
          }}
        >
          <div className="mb-4 px-1">
            <button
              type="button"
              onClick={closeDetailPage}
              className="flex items-center gap-2 text-[#1bac4b] hover:text-emerald-600 hover:bg-[#1bac4b]/10 transition-colors cursor-pointer py-3 rounded-md"
            >
              <ChevronLeft className="h-5 w-5" />
              Orqaga
            </button>
          </div>
          {(() => {
            const gallery = getGallery(detailFood)
            const total = gallery.length || 1
            const pageSwipe = useRef({
  startX: 0,
  startY: 0,
  active: false,
  id: null,
  locked: null // 'x' | 'y'
})

const onPagePointerDown = (e) => {
  pageSwipe.current = {
    startX: e.clientX,
    startY: e.clientY,
    active: true,
    id: e.pointerId,
    locked: null
  }
}

const onPagePointerMove = (e) => {
  const state = pageSwipe.current
  if (!state.active || e.pointerId !== state.id) return

  const dx = e.clientX - state.startX
  const dy = e.clientY - state.startY

  // lock direction
  if (!state.locked) {
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      state.locked = Math.abs(dy) > Math.abs(dx) ? 'y' : 'x'
    }
  }

  // faqat vertical ishlaydi
  if (state.locked === 'y' && dy > 0) {
    setDragY(dy)
    setDragProgress(Math.min(dy / 300, 1))
  }
}

const onPagePointerUp = (e) => {
  const state = pageSwipe.current
  if (!state.active || e.pointerId !== state.id) return

  const dy = e.clientY - state.startY

  if (state.locked === 'y' && dy > 120) {
    closeDetailPage()
  } else {
    setDragY(0)
    setDragProgress(0)
  }

  pageSwipe.current = {
    startX: 0,
    startY: 0,
    active: false,
    id: null,
    locked: null
  }
}
            return (
              <>
                <motion.div
                  className="relative mb-4 overflow-hidden rounded-2xl"
                  
                    onPointerDown={onPagePointerDown}
                    onPointerMove={onPagePointerMove}
                    onPointerUp={onPagePointerUp}
                    onPointerCancel={onPagePointerUp}
                    style={{
                      y: dragY,
                      scale: 1 - dragProgress * 0.1,
                      opacity: 1 - dragProgress * 0.5
                    }}
                >
                  <motion.div
                    data-gallery
                    drag="x"
                    dragElastic={0.2}
                    dragConstraints={{ left: 0, right: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 28 }} // smoother, slightly slower spring
                    onDrag={(event, info) => {
                      const threshold = 50
                      if (Math.abs(info.offset.x) > threshold) {
                        if (info.offset.x > threshold && detailSlide > 0) {
                          setDetailSlide((prev) => prev - 1)
                          info.offset.x = 0
                        } else if (info.offset.x < -threshold && detailSlide < total - 1) {
                          setDetailSlide((prev) => prev + 1)
                          info.offset.x = 0
                        }
                      }
                    }}
                    onPointerDown={onSlidePointerDown}
                    onPointerMove={onSlidePointerMove}
                    onPointerUp={(e) => onSlidePointerUp(e, total)}
                    onPointerCancel={(e) => onSlidePointerUp(e, total)}
                    className="relative cursor-grab active:cursor-grabbing touch-pan-y"
                  >
                    <ImageWithLoader
                      src={gallery[detailSlide % total]}
                      alt={detailFood.nomi}
                      className="h-80 w-full rounded-2xl object-cover select-none pointer-events-none"
                    />
                    {total > 1 && (
                      <div className="pointer-events-none absolute inset-0 flex items-stretch justify-between">
                        <button
                          type="button"
                          data-slide-control
                          aria-label="Oldingi rasm"
                          onClick={() => setDetailSlide((prev) => (prev - 1 + total) % total)}
                          className="pointer-events-auto group flex flex-1 items-center justify-start bg-gradient-to-r from-transparent via-transparent to-transparent hover:from-black/15 hover:via-black/0 hover:to-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                        >
                          <ChevronLeft className="mx-3 h-6 w-6 text-white/0 group-hover:text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] transition-opacity duration-150" />
                        </button>
                        <button
                          type="button"
                          data-slide-control
                          aria-label="Keyingi rasm"
                          onClick={() => setDetailSlide((prev) => (prev + 1) % total)}
                          className="pointer-events-auto group flex flex-1 items-center justify-end bg-gradient-to-l from-transparent via-transparent to-transparent hover:from-black/15 hover:via-black/0 hover:to-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                        >
                          <ChevronRight className="mx-3 h-6 w-6 text-white/0 group-hover:text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] transition-opacity duration-150" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                </motion.div>

                {total > 1 && (
                  <div className="flex items-center justify-center gap-2 mb-4">
                    {gallery.map((_, idx) => (
                      <motion.button
                        key={idx}
                        type="button"
                        onClick={() => setDetailSlide(idx)}
                        layoutId={`dot-${idx}`}
                        className={`h-2.5 w-2.5 rounded-full transition-all ${
                          idx === detailSlide % total ? 'bg-[#1bac4b]' : 'bg-slate-300'
                        }`}
                        aria-label={`Rasm ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}

                <div className="space-y-4 px-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h1 className="text-2xl font-semibold text-slate-900">{detailFood.nomi}</h1>
                      <p className="mt-1 text-sm text-slate-500">{detailFood.kategoriya}</p>
                    </div>
                    <div className="text-right">
                      {(() => {
                        const { hasDiscount, oldPrice, newPrice } = getDiscountInfo(detailFood)
                        return (
                          <>
                            <div className="flex items-center justify-end gap-2">
                              <div className="text-xl font-bold text-[#1bac4b]">
                                {formatPrice(hasDiscount ? newPrice : oldPrice)} so'm
                              </div>
                              {hasDiscount && (
                                <span className="text-sm text-slate-400 line-through">{formatPrice(oldPrice)}</span>
                              )}
                            </div>
                            <div className="text-sm text-slate-500">{detailFood["o'lchov"] || '1 porsiya'}</div>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                  <p className="text-base leading-5 text-slate-700">{detailFood.tarkibi}</p>
                
                </div>
              </>
            )
          })()}
        </motion.div>
      ) : (
        // Render main catalog page
        <section className="mx-auto max-w-7xl flex flex-col flex-1 w-full"> {/* full-height column so swipe container can flex */}
          <motion.div
            initial={{ y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="mb-4 px-1"
          >
            <div className="w-full flex items-center justify-start pt-6 gap-2">
              <p className="text-[#1bac4b] text-[22px] leading-none text-start">
                Taomlar menyusi
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
                    transition={{ duration: 0.5, ease: 'easeInOut' }} // slowed
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
                transition={{ duration: 0.6, ease: 'easeOut' }} // slowed header
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
                  className="flex flex-1 items-center gap-2 overflow-x-auto pb-1 px-[1px] no-scrollbar mt-1.5"
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
                        className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur transition-all duration-300 ease-[cubic-bezier(.25,.8,.25,1)] outline-[#1bac4b] will-change-transform ${
                          isActive
                            ? 'border-[#1bac4b] bg-[#1bac4b] text-white'
                            : 'border-black/10 bg-white/85 text-slate-700 hover:bg-[#1bac4b]/20'
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
                      className="shrink-0 rounded-full border border-[#1bac4b33] bg-white p-2 shadow-sm transition-all duration-200 hover:border-[#1bac4b66] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1bac4b] active:bg-[#1bac4b1c] active:scale-95"
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
              initial={{ opacity: 0, x: swipeDirection >= 0 ? 12 : -12, y: 6 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.36, ease: 'easeOut' }} // slightly slower category switch
              className="space-y-3 touch-pan-y"
            >
              <div className="px-1">
                <h2 className="text-lg font-semibold text-slate-900">
                  {selectedCategory ? selectedCategory : 'Barcha taomlar'}
                </h2>
                <p className="text-xs text-slate-500">{activeFoods.length} ta taom</p>
              </div>
              {/* list area (global swipe handled by main) */}
              <div className="pb-4"> {/* extra bottom spacing to separate list area like Telegram */}
                <FoodList foods={attachDetailHandler(activeFoods)} />
              </div>
            </motion.section>
          )}
        </section>
      )}
    </motion.main>
   )
 }
