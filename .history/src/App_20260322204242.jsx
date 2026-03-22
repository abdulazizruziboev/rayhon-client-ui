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

const FALLBACK_IMAGE = '/img-nf.png'
const CATALOG_PAGE_TRANSITION = { type: 'spring', stiffness: 300, damping: 30, mass: 0.6 }
const CATALOG_PAGE_VARIANTS = {
  enter: (direction) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1
  },
  exit: (direction) => ({
    x: direction > 0 ? -40 : 40,
    opacity: 0
  })
}
const LOADED_IMAGE_CACHE = new Set()

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

function releasePointerCaptureSafely(target, pointerId) {
  if (pointerId == null) return
  try {
    target?.releasePointerCapture?.(pointerId)
  } catch {}
}

function isSwipePointer(event) {
  return event.pointerType === 'touch' || event.pointerType === 'pen'
}

function clampIndex(index, total) {
  if (!total) return 0
  return Math.max(0, Math.min(total - 1, index))
}

function ImageWithLoader({ src, alt, className, fallback = FALLBACK_IMAGE, ...rest }) {
  const [loading, setLoading] = useState(Boolean(src) && !LOADED_IMAGE_CACHE.has(src))
  const [currentSrc, setCurrentSrc] = useState(src)
  const imgRef = useRef(null)

  useEffect(() => {
    setCurrentSrc(src)
    setLoading(Boolean(src) && !LOADED_IMAGE_CACHE.has(src))
  }, [src])

  useEffect(() => {
    const img = imgRef.current
    if (img && img.complete && img.naturalWidth > 0) {
      if (currentSrc) LOADED_IMAGE_CACHE.add(currentSrc)
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
        className={`${className} ${loading ? 'opacity-80' : 'opacity-100'} transition-opacity duration-250 rounded-[12px]`}
        onLoad={() => {
          if (currentSrc) LOADED_IMAGE_CACHE.add(currentSrc)
          setLoading(false)
        }}
        onError={(event) => {
          if (currentSrc !== fallback) {
            setCurrentSrc(fallback)
            setLoading(Boolean(fallback) && !LOADED_IMAGE_CACHE.has(fallback))
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

function FoodRow({ food, isLast }) {
  return (
    <div
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
      className={`relative flex gap-3 px-[13px] py-3.5 overflow-hidden outline-[#1bac4b] ${food.mavjudligi ? 'cursor-pointer' : 'cursor-default'}`}
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
    </div>
  )
}

const FoodList = memo(function FoodList({ foods }) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-black/10 bg-white">
      {foods.map((food, index) => (
        <FoodRow
          key={food.id}
          food={food}
          isLast={index === foods.length - 1}
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
  const [detailDragX, setDetailDragX] = useState(0)
  const [detailTrackDragging, setDetailTrackDragging] = useState(false)
  const [dragY, setDragY] = useState(0)
  const [dragProgress, setDragProgress] = useState(0)

  const searchRef = useRef(null)
  const categoryScrollRef = useRef(null)
  const categoryChipRefs = useRef([])
  const catalogSwipeStart = useRef({
    x: 0,
    y: 0,
    lastX: 0,
    lastY: 0,
    active: false,
    lock: null,
    id: null,
    startedAt: 0
  })
  const searchBlurTimeout = useRef(null)
  const detailScrollRef = useRef(null)
  const galleryViewportRef = useRef(null)

  const slideSwipe = useRef({
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    active: false,
    lock: null,
    id: null,
    startedAt: 0,
    zone: 0
  })
  const pageSwipe = useRef({
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    active: false,
    lock: null,
    id: null
  })
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
        setDetailFood(null)
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

  const resetDetailSwipeState = useCallback(() => {
    setDragY(0)
    setDragProgress(0)
    setDetailDragX(0)
    setDetailTrackDragging(false)
    slideSwipe.current = {
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      active: false,
      lock: null,
      id: null,
      startedAt: 0,
      zone: 0
    }
    pageSwipe.current = {
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      active: false,
      lock: null,
      id: null
    }
  }, [])

  const dismissDetailPage = useCallback(() => {
    closeDetailPage()
  }, [closeDetailPage])

  const focusSearchInput = useCallback(() => {
    requestAnimationFrame(() => searchRef.current?.focus())
  }, [])

  const openSearch = useCallback(() => {
    clearTimeout(searchBlurTimeout.current)
    setSearchOpen(true)
  }, [])

  const closeSearch = useCallback(() => {
    clearTimeout(searchBlurTimeout.current)
    setSearchOpen(false)
  }, [])

  const handleSearchAction = useCallback(() => {
    clearTimeout(searchBlurTimeout.current)

    if (query) {
      setQuery('')
      setSearchOpen(true)
      focusSearchInput()
      return
    }

    closeSearch()
  }, [closeSearch, focusSearchInput, query])

  const changeDetailSlide = useCallback((step, total) => {
    if (total <= 1 || !step) return

    setDetailSlide((prev) => clampIndex(prev + step, total))
  }, [])

  const jumpToDetailSlide = useCallback(
    (nextIndex, total) => {
      if (total <= 1 || nextIndex === detailSlide) return

      setDetailSlide(clampIndex(nextIndex, total))
    },
    [detailSlide]
  )

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
  const attachDetailHandler = useCallback(
    (list) => list.map((item) => ({ ...item, onOpenDetails: openDetailPage })),
    [openDetailPage]
  )
  const searchActive = searchOpen || Boolean(query)
  const activeFoodsWithHandlers = useMemo(
    () => attachDetailHandler(activeFoods),
    [activeFoods, attachDetailHandler]
  )
  const previousCatalogCountRef = useRef(activeFoodsWithHandlers.length)
  const transitionCatalogCount = Math.max(activeFoodsWithHandlers.length, previousCatalogCountRef.current)
  const searchResultsWithHandlers = useMemo(
    () => attachDetailHandler(searchResults),
    [searchResults, attachDetailHandler]
  )

  useEffect(() => {
    previousCatalogCountRef.current = activeFoodsWithHandlers.length
  }, [activeFoodsWithHandlers.length])

  const selectCategoryByIndex = useCallback(
    (nextIndex) => {
      if (nextIndex === activeCategoryIndex) return
      const nextLabel = categoryButtons[nextIndex]
      if (!nextLabel) return
      setSwipeDirection(nextIndex > activeCategoryIndex ? 1 : -1)
      setSelectedCategory(nextLabel === 'Barchasi' ? null : nextLabel)
    },
    [activeCategoryIndex, categoryButtons]
  )

  const moveCategory = useCallback(
    (step) => {
      const nextIndex = Math.max(0, Math.min(categoryButtons.length - 1, activeCategoryIndex + step))
      if (nextIndex === activeCategoryIndex) return
      selectCategoryByIndex(nextIndex)
    },
    [activeCategoryIndex, categoryButtons.length, selectCategoryByIndex]
  )

  useEffect(() => {
    if (!searchOpen) return

    const frameId = requestAnimationFrame(() => searchRef.current?.focus())
    return () => cancelAnimationFrame(frameId)
  }, [searchOpen])

  useEffect(() => () => clearTimeout(searchBlurTimeout.current), [])

  // Telegram-like global catalog swipe (full content area)
  const onCatalogPointerDown = (event) => {
    if (event.button != null && event.button !== 0) return
    if (searchActive || detailFood) return

    const inCatalogSwipeArea = Boolean(event.target.closest('[data-catalog-swipe]'))
    if (!inCatalogSwipeArea) return
    if (event.target.closest('button, a, input, textarea, select, label, [data-gallery]')) return

    const x = event.clientX
    const y = event.clientY
    catalogSwipeStart.current = {
      x,
      y,
      lastX: x,
      lastY: y,
      active: true,
      lock: null,
      id: event.pointerId,
      startedAt: performance.now()
    }
  }

  const onCatalogPointerMove = (event) => {
    const state = catalogSwipeStart.current
    if (!state.active) return
    if (state.id != null && event.pointerId !== state.id) return

    const dx = event.clientX - state.x
    const dy = event.clientY - state.y
    state.lastX = event.clientX
    state.lastY = event.clientY

    if (!state.lock) {
      const absX = Math.abs(dx)
      const absY = Math.abs(dy)

      if (absX > 8 && absX > absY) {
        state.lock = 'x'
      } else if (absY > 8 && absY > absX) {
        state.lock = 'y'
        state.active = false
      }
    }

    if (state.lock === 'x' && event.cancelable) {
      event.preventDefault()
    }
  }

  const onCatalogPointerUp = (event) => {
    const state = catalogSwipeStart.current
    if (!state.active) {
      if (state.id != null && event.pointerId === state.id) {
        catalogSwipeStart.current = {
          x: 0,
          y: 0,
          lastX: 0,
          lastY: 0,
          active: false,
          lock: null,
          id: null,
          startedAt: 0
        }
      }
      return
    }
    if (state.id != null && event.pointerId !== state.id) return

    const dx = (event.clientX ?? state.lastX) - state.x
    const dy = (event.clientY ?? state.lastY) - state.y
    const elapsed = Math.max(1, performance.now() - state.startedAt)
    const velocityX = (dx / elapsed) * 1000
    const isHorizontal = state.lock === 'x' && Math.abs(dx) > Math.abs(dy)
    const atFirst = activeCategoryIndex <= 0
    const atLast = activeCategoryIndex >= categoryButtons.length - 1
    const isEdgePush = (dx > 0 && atFirst) || (dx < 0 && atLast)
    const threshold = isEdgePush ? 84 : 60

    if (isHorizontal) {
      const shouldMoveNext = (dx < -threshold || velocityX < -680) && !atLast
      const shouldMovePrev = (dx > threshold || velocityX > 680) && !atFirst

      if (shouldMoveNext) moveCategory(1)
      else if (shouldMovePrev) moveCategory(-1)
    }

    catalogSwipeStart.current = {
      x: 0,
      y: 0,
      lastX: 0,
      lastY: 0,
      active: false,
      lock: null,
      id: null,
      startedAt: 0
    }
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
    resetDetailSwipeState()
    if (detailFood) {
      setDetailSlide(0)
      if (detailScrollRef.current) detailScrollRef.current.scrollTop = 0
    }
  }, [detailFood, resetDetailSwipeState])

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
    if (!isSwipePointer(event) && !event.target?.closest?.('[data-slide-zone]')) return
    const x = event.clientX
    const y = event.clientY
    const zone = Number(event.target?.closest?.('[data-slide-zone]')?.dataset?.slideZone || 0)
    slideSwipe.current = {
      startX: x,
      startY: y,
      lastX: x,
      lastY: y,
      active: true,
      lock: null,
      id: event.pointerId ?? null,
      startedAt: performance.now(),
      zone
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const onSlidePointerMove = (event, total) => {
    const state = slideSwipe.current
    if (!state.active) return
    if (state.id !== null && event.pointerId !== state.id) return
    const dx = event.clientX - state.startX
    const dy = event.clientY - state.startY
    state.lastX = event.clientX
    state.lastY = event.clientY

    if (!state.lock) {
      const absX = Math.abs(dx)
      const absY = Math.abs(dy)

      if (total > 1 && absX > 8 && absX > absY) {
        state.lock = 'x'
      } else if (dy > 8 && absY > absX) {
        state.lock = 'y'
      }
    }

    if (state.lock === 'x') {
      const isFirst = detailSlide === 0 && dx > 0
      const isLast = detailSlide === total - 1 && dx < 0
      const boundedDx = isFirst || isLast ? dx * 0.32 : dx

      setDetailTrackDragging(true)
      setDetailDragX(boundedDx)
      setDragY(0)
      setDragProgress(0)
      event.preventDefault()
      return
    }

    if (state.lock === 'y') {
      const nextDragY = Math.max(0, dy)
      setDetailTrackDragging(false)
      setDetailDragX(0)
      setDragY(nextDragY)
      setDragProgress(Math.min(1, nextDragY / 220))
      event.preventDefault()
    }
  }

  const onSlidePointerUp = (event, total) => {
    const state = slideSwipe.current
    if (!state.active) return
    if (state.id !== null && event.pointerId !== state.id) return

    const dx = (event.clientX ?? state.lastX) - state.startX
    const dy = (event.clientY ?? state.lastY) - state.startY
    const elapsed = Math.max(1, performance.now() - state.startedAt)
    const velocityX = (dx / elapsed) * 1000
    const viewportWidth = galleryViewportRef.current?.offsetWidth || 320
    const thresholdX = Math.min(120, viewportWidth * 0.18)
    const thresholdY = 100

    releasePointerCaptureSafely(event.currentTarget, state.id)

    if (state.lock === 'y' && dy > thresholdY && Math.abs(dy) > Math.abs(dx)) {
      dismissDetailPage()
      return
    }

    if (state.lock === 'x' && total > 1) {
      const shouldMoveNext = (dx < -thresholdX || velocityX < -520) && detailSlide < total - 1
      const shouldMovePrev = (dx > thresholdX || velocityX > 520) && detailSlide > 0

      if (shouldMoveNext) {
        changeDetailSlide(1, total)
      } else if (shouldMovePrev) {
        changeDetailSlide(-1, total)
      }
    }

    if (!state.lock && total > 1 && Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      if (state.zone > 0 && detailSlide < total - 1) {
        changeDetailSlide(1, total)
      } else if (state.zone < 0 && detailSlide > 0) {
        changeDetailSlide(-1, total)
      }
    }

    resetDetailSwipeState()
  }

  const onDetailPointerDown = (event) => {
    if (!isSwipePointer(event)) return
    if (event.target?.closest?.('button, a, input, textarea, select, label, [data-gallery]')) return

    const x = event.clientX
    const y = event.clientY
    pageSwipe.current = {
      startX: x,
      startY: y,
      lastX: x,
      lastY: y,
      active: true,
      lock: null,
      id: event.pointerId ?? null
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const onDetailPointerMove = (event) => {
    const state = pageSwipe.current
    if (!state.active) return
    if (state.id !== null && event.pointerId !== state.id) return

    const dx = event.clientX - state.startX
    const dy = event.clientY - state.startY

    state.lastX = event.clientX
    state.lastY = event.clientY

    if (!state.lock) {
      const absX = Math.abs(dx)
      const absY = Math.abs(dy)

      if (dx > 12 && absX > absY) {
        state.lock = 'x'
      } else if ((detailScrollRef.current?.scrollTop ?? 0) <= 4 && dy > 12 && absY > absX) {
        state.lock = 'y'
      } else if (absX > 20 || absY > 20) {
        state.active = false
        releasePointerCaptureSafely(event.currentTarget, state.id)
      }
    }

    if (state.lock === 'x') {
      setDragY(0)
      setDragProgress(Math.min(1, Math.max(0, dx) / 320))
      event.preventDefault()
    }

    if (state.lock === 'y') {
      const nextDragY = Math.max(0, dy)
      setDragY(nextDragY)
      setDragProgress(Math.min(1, nextDragY / 220))
      event.preventDefault()
    }
  }

  const onDetailPointerUp = (event) => {
    const state = pageSwipe.current

    if (!state.active) {
      if (state.id !== null && event.pointerId === state.id) {
        resetDetailSwipeState()
      }
      return
    }

    if (state.id !== null && event.pointerId !== state.id) return

    const dx = (event.clientX ?? state.lastX) - state.startX
    const dy = (event.clientY ?? state.lastY) - state.startY
    const closeByHorizontalSwipe = state.lock === 'x' && dx > 88 && dx > Math.abs(dy)
    const closeByVerticalSwipe = state.lock === 'y' && dy > 110 && dy > Math.abs(dx)

    releasePointerCaptureSafely(event.currentTarget, state.id)

    if (closeByHorizontalSwipe || closeByVerticalSwipe) {
      dismissDetailPage()
      return
    }

    resetDetailSwipeState()
  }

  const catalogPageMinHeight = useMemo(
    () => Math.max(260, transitionCatalogCount * 114 + 110),
    [transitionCatalogCount]
  )

  const renderCatalogPageContent = (foodsList) => (
    <div className="space-y-3 touch-pan-y">
      <div className="px-1">
        <h2 className="text-lg font-semibold text-slate-900">
          {selectedCategory ? selectedCategory : 'Barcha taomlar'}
        </h2>
        <p className="text-xs text-slate-500">{foodsList.length} ta taom</p>
      </div>
      <div className="pb-4">
        <FoodList foods={foodsList} />
      </div>
    </div>
  )

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }} // slowed
      className="relative min-h-screen flex flex-col overflow-x-clip bg-white p-3 text-slate-900 *:selection:bg-[#1bac4b33] *:selection:text-[#1bac4b]"
      style={{ touchAction: 'manipulation' }} // allow native vertical scroll and horizontal gestures
      onPointerDown={onCatalogPointerDown}
      onPointerMove={onCatalogPointerMove}
      onPointerUp={onCatalogPointerUp}
      onPointerCancel={onCatalogPointerUp}
    >
      <section
        data-catalog-swipe
        aria-hidden={Boolean(detailFood)}
        className={`mx-auto max-w-7xl flex w-full flex-1 flex-col overflow-x-clip transition-opacity duration-200 ${
          detailFood ? 'pointer-events-none select-none opacity-100' : 'opacity-100'
        }`}
      >
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

        <div className="sticky top-0 z-40 mb-4 bg-white py-2 pb-2 px-1" id='sticky-part'>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <div
                  className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-white to-transparent transition-opacity duration-200 ${
                    catalogEdgeShadow.left ? 'opacity-100' : 'opacity-0'
                  }`}
                />
                <div
                  className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white to-[#fff3] transition-opacity duration-200 ${
                    catalogEdgeShadow.right ? 'opacity-100' : 'opacity-0'
                  }`}
                />
                <div
                  ref={categoryScrollRef}
                  data-catalog-swipe
                  className="flex items-center gap-2.5 overflow-x-auto pb-1 px-1.5 py-3 no-scrollbar mt-1.5"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
{categoryButtons.map((category, index) => {
  const isActive = index === activeCategoryIndex
  const [loaded, setLoaded] = useState(false)
  const categoryImages = {
    "Barchasi": "https://zira.uz/wp-content/uploads/2020/08/kai--natma-shurpa.jpg",
    "Asosiy taom": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKp34NJDWOVx_b-Ie7JYemCuNQmGC_7HcIPQ&s",
    "Sho'rvalar": "https://ferganatourism.uz/thumb/2/v4SvIoQPtzzx7mlgX_H1gg/1200r1000/d/shurpa-3.jpg",
    "Fast food": "https://zamin.uz/uploads/posts/2025-05/b356738731_high-protein-fast-food-1.webp",
    "Grill": "https://assets.epicurious.com/photos/5b843bce1abfc56568396369/1:1/w_2560%2Cc_limit/Grilled-Chicken-with-Mustard-Sauce-and-Tomato-Salad-recipe-2-22082018.jpg"
    
  }
  return (
    <div
      key={category}
      ref={(el) => (categoryChipRefs.current[index] = el)}
      onClick={() => selectCategoryByIndex(index)}
      className="flex shrink-0 cursor-pointer flex-col items-center gap-1"
    >
      {/* IMAGE */}
      <div className="relative flex h-[70px] w-[70px] items-center justify-center rounded-full p-[3px]">
        
        {/* loader */}
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-gray-100">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-[#1bac4b]" />
          </div>
        )}

        <img
          src={categoryImages[category]}
          alt={category}
          onLoad={() => setLoaded(true)}
          className={`h-full w-full rounded-full object-cover transition-all duration-500
            ${loaded ? "blur-0 scale-100" : "blur-md scale-105"}
          `}
        />

        {/* ring */}
        <div
          className={`absolute inset-0 rounded-full ring-2 ring-offset-2 ring-offset-white transition-all duration-300
            ${
              isActive
                ? "ring-[#1bac4b]"
                : "ring-gray-300"
            }
          `}
        />
      </div>

      {/* TEXT */}
      <span
        className={`text-[12px] font-medium ${
          isActive ? "text-[#1bac4b]" : "text-gray-600"
        }`}
      >
        {category}
      </span>
    </div>
  )
})}
                </div>
              </div>

              
            </div>

            <div
              className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(.4,0,.2,1)] p-1`}
            >
              <div className="h-[46px] rounded-full border border-[#1bac4b33] bg-white px-4 ring-1 ring-[#1bac4b]/95 shadow-[0_18px_36px_-28px_rgba(27,172,75,0.38)]">
                <div
                  className="flex h-full items-center gap-2"
                  onClick={() => {
                    if (searchActive) focusSearchInput()
                  }}
                >
                  <Search className="size-5 shrink-0 text-[#1bac4b]" />

                  <div className="min-w-0 flex-1 overflow-hidden">
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
                          if (!query) closeSearch()
                        }, 140)
                      }}
                      placeholder="Qidirish..."
                      className="h-7 w-full border-0 !bg-transparent px-0 text-[15px] text-slate-900 placeholder:text-slate-400 focus-visible:ring-0"
                    />
                  </div>

                  <button
                    type="button"
                    aria-label={query ? "Qidiruvni tozalash" : "Qidiruvni yopish"}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={(event) => {
                      event.stopPropagation()
                      handleSearchAction()
                    }}
                    className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition duration-300 hover:bg-slate-200 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1bac4b] cursor-pointer"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>
            </div>
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
                <SearchResultsList foods={searchResultsWithHandlers} />
              </>
            ) : (
              <div className="rounded-2xl bg-white px-4 py-8 text-center text-sm font-medium text-slate-500">
                Taomlar topilmadi
              </div>
            )}
          </section>
        ) : (
          <section data-catalog-swipe className="relative overflow-x-clip touch-pan-y">
            <div
              data-catalog-swipe
              className="relative min-h-[100dvh] overflow-hidden"
              style={{ minHeight: `max(100dvh, ${catalogPageMinHeight}px)` }}
            >
              <div className="absolute inset-0">
                <AnimatePresence initial={false} custom={swipeDirection} mode="sync">
                  <motion.div
                    key={activeCategoryLabel}
                    custom={swipeDirection}
                    variants={CATALOG_PAGE_VARIANTS}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={CATALOG_PAGE_TRANSITION}
                    className="absolute inset-0 will-change-transform"
                  >
                    {renderCatalogPageContent(activeFoodsWithHandlers)}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </section>
        )}
      </section>

<AnimatePresence initial={false} mode="wait">
  {detailFood && (
    <motion.div
      key={`detail-${detailFood.id}`}
      ref={detailScrollRef}

      initial={{ opacity: 0, x: 80 }}
      animate={{
        opacity: 1 - Math.pow(Math.abs(dragProgress), 1.3) * 0.2,
        x: 0
      }}
      exit={{
        x: typeof window !== 'undefined' ? window.innerWidth : 400,
        opacity: 0,
        transition: {
          x: {
            type: 'spring',
            stiffness: 220,
            damping: 32,
            mass: 0.9
          },
          opacity: {
            duration: 0.22,
            ease: 'easeOut',
            delay: 0.15
          }
        }
      }}
      transition={{
        type: 'spring',
        stiffness: 240,
        damping: 30,
        mass: 0.8
      }}

      className="fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-white p-3 pb-8 will-change-transform"

      onPointerDown={onDetailPointerDown}
      onPointerMove={onDetailPointerMove}
      onPointerUp={onDetailPointerUp}
      onPointerCancel={onDetailPointerUp}

      style={{ touchAction: 'pan-y' }}
    >
            <div className="mx-auto max-w-7xl">
              <div className="mb-4 px-1">
                <button
                  type="button"
                  onClick={dismissDetailPage}
                  className="flex items-center gap-2 text-[#1bac4b] hover:text-emerald-600 hover:bg-[#1bac4b]/10 transition-colors cursor-pointer py-3 px-2 rounded-md"
                >
                  <ChevronLeft className="h-5 w-5" />
                  Orqaga
                </button>
              </div>
              {(() => {
                const gallery = getGallery(detailFood)
                const total = gallery.length || 1

                return (
                  <>
                    <motion.div
                      className="relative mb-4 overflow-hidden rounded-2xl"
                      style={{
                        scale: Math.max(0.8, 1 - Math.abs(dragProgress) * 0.2),
                        y: Math.max(0, dragY)
                      }}
                    >
                      <div
                        ref={galleryViewportRef}
                        className="group/gallery relative h-80 overflow-hidden rounded-2xl bg-slate-100"
                      >
                        <div
                          data-gallery
                          onPointerDown={onSlidePointerDown}
                          onPointerMove={(event) => onSlidePointerMove(event, total)}
                          onPointerUp={(event) => onSlidePointerUp(event, total)}
                          onPointerCancel={(event) => onSlidePointerUp(event, total)}
                          className={`flex h-full touch-pan-y select-none ${
                            total > 1 ? 'cursor-grab active:cursor-grabbing' : ''
                          } ${detailTrackDragging ? '' : 'transition-transform duration-300 ease-out'}`}
                          style={{
                            width: `${total * 100}%`,
                            transform: `translateX(calc(-${detailSlide * (100 / total)}% + ${detailDragX}px))`
                          }}
                        >
                          {gallery.map((imageSrc, index) => (
                            <div
                              key={`${detailFood.id}-${index}`}
                              className="h-full flex-none"
                              style={{ width: `${100 / total}%` }}
                            >
                              <ImageWithLoader
                                src={imageSrc}
                                alt={`${detailFood.nomi} ${index + 1}`}
                                className="h-80 w-full rounded-2xl object-cover pointer-events-none"
                              />
                            </div>
                          ))}
                        </div>

                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/10 via-transparent to-transparent" />

                        {total > 1 && (
                          <div className="pointer-events-none absolute inset-0">
                            <button
                              type="button"
                              data-slide-zone="-1"
                              aria-label="Oldingi rasm"
                              aria-disabled={detailSlide === 0}
                              onPointerDown={onSlidePointerDown}
                              onPointerMove={(event) => onSlidePointerMove(event, total)}
                              onPointerUp={(event) => onSlidePointerUp(event, total)}
                              onPointerCancel={(event) => onSlidePointerUp(event, total)}
                              className="pointer-events-auto absolute inset-y-0 left-0 flex w-1/2 items-center justify-start px-3 touch-pan-y"
                            >
                              <span
                                className={`inline-flex size-9 items-center justify-center rounded-full bg-black/18 text-white/85 opacity-0 backdrop-blur-sm transition duration-200 group-hover/gallery:opacity-100 group-focus-within/gallery:opacity-100 cursor-pointer ${
                                  detailSlide === 0
                                    ? 'group-hover/gallery:opacity-35 group-focus-within/gallery:opacity-35'
                                    : 'group-hover/gallery:bg-black/28 group-focus-within/gallery:bg-black/28'
                                }`}
                              >
                                <ChevronLeft className="h-5 w-5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]" />
                              </span>
                            </button>
                            <button
                              type="button"
                              data-slide-zone="1"
                              aria-label="Keyingi rasm"
                              aria-disabled={detailSlide === total - 1}
                              onPointerDown={onSlidePointerDown}
                              onPointerMove={(event) => onSlidePointerMove(event, total)}
                              onPointerUp={(event) => onSlidePointerUp(event, total)}
                              onPointerCancel={(event) => onSlidePointerUp(event, total)}
                              className="pointer-events-auto absolute inset-y-0 right-0 flex w-1/2 items-center justify-end px-3 touch-pan-y"
                            >
                              <span
                                className={`inline-flex size-9 items-center justify-center rounded-full bg-black/18 text-white/85 opacity-0 backdrop-blur-sm transition duration-200 group-hover/gallery:opacity-100 group-focus-within/gallery:opacity-100 cursor-pointer ${
                                  detailSlide === total - 1
                                    ? 'group-hover/gallery:opacity-35 group-focus-within/gallery:opacity-35'
                                    : 'group-hover/gallery:bg-black/28 group-focus-within/gallery:bg-black/28'
                                }`}
                              >
                                <ChevronRight className="h-5 w-5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]" />
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>

                    {total > 1 && (
                      <div className="flex items-center justify-center gap-2 mb-4">
                        {gallery.map((_, idx) => (
                          <motion.button
                            key={idx}
                            type="button"
                            onClick={() => jumpToDetailSlide(idx, total)}
                            layoutId={`dot-${idx}`}
                            className={`h-2.5 w-2.5 rounded-full transition-all ${
                              idx === detailSlide ? 'bg-[#1bac4b]' : 'bg-slate-300'
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
   )
 }
