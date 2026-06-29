'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, uploadListingPhoto, deleteListingPhoto } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import { Header } from '@/components/header'
import { CITIES_DATA } from '@/lib/constants'
import { useRouter } from 'next/navigation'
import { Camera, ShieldAlert, RotateCcw, X } from 'lucide-react'
import { Mi } from '@/components/icons'

const DRAFT_KEY = 'baspana-add-draft'

// Formatting helper for currency inputs (spaces as thousands separators)
function formatBudgetDisplay(val: string) {
  const digits = val.replace(/\D/g, '')
  if (!digits) return ''
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

function handleNumberKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
  if (['e', 'E', '+', '-', '.', ','].includes(e.key)) {
    e.preventDefault()
  }
}

export default function AddListingPage() {
  const router = useRouter()
  const { user } = useAppStore()

  // Steps: 'select-type' | 'fill-form'
  const [step, setStep] = useState<'select-type' | 'fill-form'>('select-type')
  const [formMode, setFormMode] = useState<'apartment' | 'roommate'>('apartment')

  // Form Fields State
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [gender, setGender] = useState('')
  const [ageFrom, setAgeFrom] = useState('')
  const [ageTo, setAgeTo] = useState('')
  const [rooms, setRooms] = useState('')
  const [canLiveWith, setCanLiveWith] = useState('') // for apartment: "могу жить с"
  const [peopleCount, setPeopleCount] = useState('') // "Нас" / "Будет жить"
  const [searchingCount, setSearchingCount] = useState('') // "Ищу"
  const [term, setTerm] = useState('') // Срок
  const [totalPeople, setTotalPeople] = useState('') // "Общий"
  const [deposit, setDeposit] = useState('')
  const [contract, setContract] = useState('')
  const [priceFrom, setPriceFrom] = useState('')
  const [priceTo, setPriceTo] = useState('')
  const [description, setDescription] = useState('')
  const [phone, setPhone] = useState('') // Raw 10-digit string
  const [addressLink, setAddressLink] = useState('') // 2GIS link for roommate
  const [photos, setPhotos] = useState<string[]>([]) // Array of Storage URLs
  const [uploadingPreviews, setUploadingPreviews] = useState<string[]>([]) // Temp object URLs while uploading
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false)

  // Dynamic Validation / Pricing Settings
  const [userListingsCount, setUserListingsCount] = useState(0)
  const [publishPrice, setPublishPrice] = useState(0)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  // Error borders state
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [submitErrorMsg, setSubmitErrorMsg] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Draft auto-save state
  const [hasDraftBanner, setHasDraftBanner] = useState(false)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync district based on city
  const currentCityData = CITIES_DATA.find((c) => c.city === city)
  const hasDistricts = currentCityData && currentCityData.districts.length > 0

  // ─── #A: Draft save / restore helpers ────────────────────────────────────
  const getDraftFields = useCallback(() => ({
    formMode, step, city, district, gender, ageFrom, ageTo, rooms,
    canLiveWith, peopleCount, searchingCount, term, totalPeople,
    deposit, contract, priceFrom, priceTo, description, phone, addressLink,
  }), [formMode, step, city, district, gender, ageFrom, ageTo, rooms,
    canLiveWith, peopleCount, searchingCount, term, totalPeople,
    deposit, contract, priceFrom, priceTo, description, phone, addressLink])

  // Save draft to localStorage with debounce (500ms)
  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      const draft = getDraftFields()
      // Only save if form has been started
      const hasAnyData = city || gender || rooms || priceFrom || priceTo || phone || description
      if (hasAnyData) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
      }
    }, 500)
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current) }
  }, [getDraftFields, city, gender, rooms, priceFrom, priceTo, phone, description])

  // Check for existing draft on mount
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const hasData = parsed.city || parsed.gender || parsed.rooms || parsed.priceFrom || parsed.phone
        if (hasData) setHasDraftBanner(true)
      } catch { /* ignore corrupt draft */ }
    }
  }, [])

  // Restore draft fields
  const handleRestoreDraft = () => {
    const saved = localStorage.getItem(DRAFT_KEY)
    if (!saved) return
    try {
      const d = JSON.parse(saved)
      if (d.formMode) setFormMode(d.formMode)
      if (d.step) setStep(d.step)
      if (d.city) setCity(d.city)
      if (d.district) setDistrict(d.district)
      if (d.gender) setGender(d.gender)
      if (d.ageFrom) setAgeFrom(d.ageFrom)
      if (d.ageTo) setAgeTo(d.ageTo)
      if (d.rooms) setRooms(d.rooms)
      if (d.canLiveWith) setCanLiveWith(d.canLiveWith)
      if (d.peopleCount) setPeopleCount(d.peopleCount)
      if (d.searchingCount) setSearchingCount(d.searchingCount)
      if (d.term) setTerm(d.term)
      if (d.totalPeople) setTotalPeople(d.totalPeople)
      if (d.deposit) setDeposit(d.deposit)
      if (d.contract) setContract(d.contract)
      if (d.priceFrom) setPriceFrom(d.priceFrom)
      if (d.priceTo) setPriceTo(d.priceTo)
      if (d.description) setDescription(d.description)
      if (d.phone) setPhone(d.phone)
      if (d.addressLink) setAddressLink(d.addressLink)
    } catch { /* ignore */ }
    setHasDraftBanner(false)
  }

  // Dismiss draft without restoring
  const handleDismissDraft = () => {
    localStorage.removeItem(DRAFT_KEY)
    setHasDraftBanner(false)
  }

  // Clear draft after successful submit
  const clearDraft = () => localStorage.removeItem(DRAFT_KEY)

  // ─── #B: Warn before leaving if form has data ─────────────────────────────
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasData = city || gender || rooms || priceFrom || phone || description
      if (hasData && step === 'fill-form') {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [city, gender, rooms, priceFrom, phone, description, step])
  // ──────────────────────────────────────────────────────────────────────────

  // Load user listings count and dynamic publish cost
  useEffect(() => {
    if (!user) {
      router.push('/profile')
      return
    }

    const loadMeta = async () => {
      try {
        const { count, error: countError } = await supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', user.id)
          .eq('status', 'active')

        if (countError) throw countError
        setUserListingsCount(count || 0)

        const { data: priceData, error: priceError } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'price_publish')
          .single()

        if (priceError) throw priceError
        if (priceData) setPublishPrice(priceData.value)
      } catch (err) {
        console.error('Error loading form meta:', err)
      }
    }

    loadMeta()
  }, [user, router])

  // Custom Dropdown click handler
  const handleDropdownSelect = (dropdown: string, val: string) => {
    if (dropdown === 'city') {
      setCity(val)
      const nextCityData = CITIES_DATA.find((c) => c.city === val)
      const nextHasDistricts = nextCityData && nextCityData.districts.length > 0
      setDistrict(nextHasDistricts ? (formMode === 'apartment' ? 'Не важно' : nextCityData.districts[0]) : '')
      setErrors((prev) => ({ ...prev, city: false, district: false }))
      setActiveDropdown(null)
      return
    }
    if (dropdown === 'district') setDistrict(val)
    if (dropdown === 'gender') setGender(val)
    if (dropdown === 'rooms') setRooms(val)
    if (dropdown === 'canLiveWith') setCanLiveWith(val)
    if (dropdown === 'term') setTerm(val)
    if (dropdown === 'contract') setContract(val)
    if (dropdown === 'ageFrom') {
      setAgeFrom(val)
      const num = parseInt(val)
      if (ageTo && parseInt(ageTo) < num) {
        setAgeTo(val)
      }
    }
    if (dropdown === 'ageTo') {
      setAgeTo(val)
      const num = parseInt(val)
      if (ageFrom && parseInt(ageFrom) > num) {
        setAgeFrom(val)
      }
    }
    if (dropdown === 'peopleCount') setPeopleCount(val)
    if (dropdown === 'searchingCount') setSearchingCount(val)
    if (dropdown === 'totalPeople') setTotalPeople(val)
    if (dropdown === 'deposit') setDeposit(val)
    if (dropdown === 'priceFrom') setPriceFrom(val)
    if (dropdown === 'priceTo') setPriceTo(val)

    setActiveDropdown(null)
    setErrors((prev) => ({ ...prev, [dropdown]: false }))
  }

  const toggleDropdown = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '')
    let stripped = rawDigits
    if (rawDigits.length >= 11 && (rawDigits.startsWith('7') || rawDigits.startsWith('8'))) {
      stripped = rawDigits.substring(1)
    }
    const limited = stripped.substring(0, 10)
    setPhone(limited)
    setErrors((prev) => ({ ...prev, phone: false }))
  }

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrors((prev) => ({ ...prev, photos: false }))
    if (!e.target.files || !user) return
    const fileList = Array.from(e.target.files)
    const limit = formMode === 'apartment' ? 3 : 5
    const totalSlots = photos.length + uploadingPreviews.length
    const availableSlots = limit - totalSlots

    if (availableSlots <= 0) {
      alert(`Максимум можно добавить ${limit} фотографий.`)
      return
    }

    const filesToUpload = fileList.slice(0, availableSlots)
    // Create local object URLs for instant preview
    const previews = filesToUpload.map((f) => URL.createObjectURL(f))
    setUploadingPreviews((prev) => [...prev, ...previews])
    setIsUploadingPhotos(true)

    // Upload all files to Supabase Storage in parallel
    const results = await Promise.all(
      filesToUpload.map(async (file, idx) => {
        const url = await uploadListingPhoto(file, user.id)
        return { preview: previews[idx], url }
      })
    )

    // Remove previews and add confirmed URLs
    const successPreviews = results.filter((r) => r.url).map((r) => r.preview)
    const successUrls = results.filter((r) => r.url).map((r) => r.url as string)
    setUploadingPreviews((prev) => prev.filter((p) => !successPreviews.includes(p)))
    setPhotos((prev) => [...prev, ...successUrls])
    setIsUploadingPhotos(false)

    // Release object URLs to free memory
    previews.forEach((p) => URL.revokeObjectURL(p))
  }

  const handleRemovePhoto = async (idx: number) => {
    const url = photos[idx]
    setPhotos((prev) => prev.filter((_, i) => i !== idx))
    // Delete from Storage if it's a Storage URL (not legacy Base64)
    if (url && !url.startsWith('data:')) {
      await deleteListingPhoto(url)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSubmitErrorMsg('')
    const newErrors: Record<string, boolean> = {}

    if (userListingsCount >= 5 && user?.email !== 'n.erdaullet@gmail.com') {
      setSubmitErrorMsg('Достигнут лимит (максимум 5 объявлений). Чтобы опубликовать новое, удалите одно из старых.')
      return
    }

    // Validation
    if (!city) newErrors.city = true

    // District Validation (mandatory if city has districts)
    if (hasDistricts) {
      if (formMode === 'roommate') {
        if (!district || district === 'Не важно' || district === '-') {
          newErrors.district = true
        }
      } else {
        if (!district || district === '-') {
          newErrors.district = true
        }
      }
    }

    if (formMode === 'roommate') {
      if (!gender) newErrors.gender = true
      if (!rooms) newErrors.rooms = true
      if (!peopleCount) newErrors.peopleCount = true
      if (!searchingCount) newErrors.searchingCount = true
      if (!totalPeople) newErrors.totalPeople = true
      if (!deposit) newErrors.deposit = true
      if (!contract) newErrors.contract = true
    } else {
      if (!gender) newErrors.gender = true
      if (!rooms) newErrors.rooms = true
      if (!term) newErrors.term = true
      if (!deposit) newErrors.deposit = true
      if (!contract) newErrors.contract = true
    }

    const fromVal = priceFrom ? parseInt(priceFrom) : 0
    const toVal = priceTo ? parseInt(priceTo) : 0

    if (!priceFrom) {
      newErrors.priceFrom = true
    } else if (fromVal < 10000 || fromVal > 900000) {
      newErrors.priceFrom = true
      setSubmitErrorMsg('Бюджет должен быть от 10 000 ₸ до 900 000 ₸.')
    }

    if (!priceTo) {
      newErrors.priceTo = true
    } else if (toVal < 10000 || toVal > 900000) {
      newErrors.priceTo = true
      setSubmitErrorMsg('Бюджет должен быть от 10 000 ₸ до 900 000 ₸.')
    }

    if (priceFrom && priceTo && fromVal > toVal) {
      newErrors.priceFrom = true
      newErrors.priceTo = true
      setSubmitErrorMsg('Минимальный бюджет (от) не может быть больше максимального (до).')
    }

    if (!ageFrom) newErrors.ageFrom = true
    if (formMode === 'roommate') {
      if (!ageTo) newErrors.ageTo = true
      if (ageFrom && ageTo && parseInt(ageFrom) > parseInt(ageTo)) {
        newErrors.ageFrom = true
        newErrors.ageTo = true
        setSubmitErrorMsg('Минимальный возраст (от) не может быть больше максимального (до).')
      }
    }


    if (!phone || phone.length < 10) newErrors.phone = true


    if (formMode === 'roommate') {
      if (!addressLink) {
        newErrors.addressLink = true
      } else {
        // Must be a real https URL pointing to 2gis — prevents javascript:/data: scheme bypasses
        const is2gisLink = /^https?:\/\/(?:[^/]*\.)?2gis\.(?:kz|ru|com)\//i.test(addressLink)
        if (!is2gisLink) {
          newErrors.addressLink = true
          setSubmitErrorMsg('Неверный формат ссылки 2GIS. Ссылка должна начинаться с https://2gis.kz, https://2gis.ru или https://go.2gis.com')
        }
      }
    }

    // Photo limits: apartment = min 0, max 3; roommate = min 3, max 5
    if (formMode === 'apartment') {
      if (photos.length > 3) {
        newErrors.photos = true
        setSubmitErrorMsg('Максимум можно добавить 3 фотографии.')
      }
    } else {
      if (photos.length < 3) {
        newErrors.photos = true
        setSubmitErrorMsg('Необходимо загрузить от 3 до 5 фотографий.')
      } else if (photos.length > 5) {
        newErrors.photos = true
        setSubmitErrorMsg('Максимум можно добавить 5 фотографий.')
      }
    }

    if (Object.keys(newErrors).length > 0 || submitErrorMsg) {
      setErrors(newErrors)
      if (!submitErrorMsg) setSubmitErrorMsg('Пожалуйста, заполните выделенные обязательные поля корректно.')
      return
    }

    setIsSubmitting(true)

    const payload = {
      owner_id: user.id,
      mode: formMode,
      city,
      district: hasDistricts && district !== 'Не важно' && district !== '' ? district : null,
      gender,
      age_from: parseInt(ageFrom),
      age_to: formMode === 'apartment' ? parseInt(ageFrom) : parseInt(ageTo),
      rooms: rooms || '1-комнатный',
      can_live_with: formMode === 'apartment' ? (canLiveWith || 'Не важно') : peopleCount,
      people_count: formMode === 'roommate'
        ? Math.max(1, (parseInt(totalPeople) || 1) - (parseInt(searchingCount) || 1))
        : (parseInt(peopleCount) || 1),
      searching_count: formMode === 'roommate' ? (parseInt(searchingCount) || 1) : (parseInt(peopleCount) || 1),
      term: term || '1 месяц',
      total_people: formMode === 'roommate' ? (parseInt(totalPeople) || 1) : (parseInt(totalPeople) || 1),
      deposit: deposit === 'Есть' ? 1 : 0,
      contract: contract === 'Есть' ? 'yes' : 'no',
      price_from: fromVal,
      price_to: toVal,
      photos,
      description,
      phone: `+7${phone}`,
      address_link: formMode === 'roommate' ? addressLink : null,
      is_premium: false,
      status: 'active',
    }

    try {
      const { error } = await supabase
        .from('listings')
        .insert(payload)

      if (error) throw error

      // #A: Clear draft on successful submit
      clearDraft()
      router.push('/profile')
    } catch (err) {
      console.error('Error submitting listing detailed:', err)
      setSubmitErrorMsg('Ошибка сервера при создании объявления. Попробуйте ещё раз.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format phone for display as 777 777 7777
  const formatPhoneDisplay = (val: string) => {
    if (!val) return ''
    const match = val.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/)
    if (!match) return val
    let res = ''
    if (match[1]) res += `${match[1]}`
    if (match[2]) res += ` ${match[2]}`
    if (match[3]) res += ` ${match[3]}`
    return res.trim()
  }

  // Common dropdown styles (matching Figma design exactly)
  const dropdownToggleClass = (err: boolean, placeholder?: string, value?: string) =>
    `w-full bg-white dark:bg-[#25262D] border rounded-2xl py-3 px-4 text-left flex justify-between items-center transition-all duration-150 ${
      err ? 'border-[#FF3662]' : 'border-gray-200 dark:border-[rgba(195,197,217,0.12)]'
    } ${value ? 'text-zinc-900 dark:text-white font-semibold text-xs' : 'text-[#9D9D9D] font-medium text-xs'}`

  const dropdownListClass = "absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#25262D] border border-gray-200 dark:border-[rgba(195,197,217,0.12)] rounded-2xl shadow-xl max-h-80 overflow-y-auto"
  const dropdownItemClass = "w-full text-left py-2.5 px-4 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white"
  const dropdownChevron = <span className="text-[10px] text-[#9D9D9D] shrink-0">▼</span>

  return (
    <div className="flex flex-col w-full h-full">
      {/* Dynamic Header */}
      <Header
        type="title"
        title={step === 'select-type' ? 'объявление' : formMode === 'apartment' ? 'ищу квартиру' : 'ищу соседа'}
        showBack={true}
        onBack={step === 'fill-form' ? () => setStep('select-type') : undefined}
        showHelpToggle={true}
      />

      {/* #A: Draft restore banner */}
      {hasDraftBanner && (
        <div className="mx-4 mt-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl px-4 py-3 flex items-center gap-3 animate-fade-in">
          <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-amber-800 dark:text-amber-300">Найден незавершённый черновик</p>
            <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">Восстановить заполненные поля?</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleRestoreDraft}
              className="text-[10px] font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl px-3 py-1.5 transition-all active:scale-95"
            >
              Восстановить
            </button>
            <button
              onClick={handleDismissDraft}
              className="text-amber-600 dark:text-amber-400 hover:text-amber-800 p-1 rounded-lg transition-all active:scale-95"
              aria-label="Закрыть"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 px-5 py-5 overflow-y-auto pb-24">

        {/* STEP 1: Select Type */}
        {step === 'select-type' && (
          <div className="h-full flex flex-col justify-center items-center select-none py-10">
            <div className="bg-white dark:bg-[#25262D] border border-gray-200/80 dark:border-[rgba(195,197,217,0.12)] rounded-3xl p-6 shadow-sm w-full text-center">
              <h2 className="text-sm font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider mb-5">
                Выберите тип объявления
              </h2>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setFormMode('apartment')
                    setDistrict('Не важно')
                    setStep('fill-form')
                  }}
                  className="w-full bg-[#007BFF] text-white rounded-2xl py-4 font-bold text-center hover:bg-blue-600 active:scale-[0.98] transition-all"
                >
                  Я ищу квартиру
                </button>
                <button
                  onClick={() => {
                    setFormMode('roommate')
                    setDistrict('')
                    setStep('fill-form')
                  }}
                  className="w-full bg-blue-50 dark:bg-[rgba(0,67,200,0.20)] text-[#007BFF] dark:text-[#7BA8FF] rounded-2xl py-4 font-bold text-center hover:bg-blue-100 dark:hover:bg-[rgba(0,67,200,0.30)] active:scale-[0.98] transition-all"
                >
                  Я ищу соседа
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Fill Form */}
        {step === 'fill-form' && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 select-none">

            {/* Warning block if at limit */}
            {userListingsCount >= 5 && user?.email !== 'n.erdaullet@gmail.com' && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed text-amber-800 dark:text-amber-300">
                <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
                <span>
                  Вы исчерпали лимит в 5 объявлений. Кнопка отправки заблокирована. Удалите старое объявление, чтобы создать новое.
                </span>
              </div>
            )}

            {/* Error banner */}
            {submitErrorMsg && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-[#FF3662] rounded-2xl p-4 flex gap-3 leading-relaxed text-xs">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <span>{submitErrorMsg}</span>
              </div>
            )}

            {/* Row 1: Город (50%) & Пол (50%) */}
            <div className="grid grid-cols-2 gap-3">
              {/* City */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('city')}
                  className={dropdownToggleClass(!!errors.city, 'Город', city)}
                >
                  <span className="truncate">{city || 'Город'}</span>
                  {dropdownChevron}
                </button>
                {activeDropdown === 'city' && (
                  <div className={dropdownListClass}>
                    {CITIES_DATA.map((c) => (
                      <button
                        key={c.city}
                        type="button"
                        onClick={() => handleDropdownSelect('city', c.city)}
                        className={dropdownItemClass}
                      >
                        {c.city}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Gender (Пол) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('gender')}
                  className={dropdownToggleClass(!!errors.gender, 'Пол', gender)}
                >
                  <span className="truncate">{gender || 'Пол'}</span>
                  {dropdownChevron}
                </button>
                {activeDropdown === 'gender' && (
                  <div className={dropdownListClass}>
                    {['Парень', 'Девушка'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => handleDropdownSelect('gender', g)}
                        className={dropdownItemClass}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Район (100%) */}
            <div className="relative">
              <button
                type="button"
                disabled={!hasDistricts}
                onClick={() => toggleDropdown('district')}
                className={`w-full border rounded-2xl py-3 px-4 text-left flex justify-between items-center transition-all text-xs ${
                  hasDistricts
                    ? errors.district
                      ? 'border-[#FF3662] bg-white dark:bg-[#25262D] text-zinc-900 dark:text-white font-semibold'
                      : district
                        ? 'bg-white dark:bg-[#25262D] border-gray-200 dark:border-[rgba(195,197,217,0.12)] text-zinc-900 dark:text-white font-semibold'
                        : 'bg-white dark:bg-[#25262D] border-gray-200 dark:border-[rgba(195,197,217,0.12)] text-[#9D9D9D] font-medium'
                    : 'bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200 dark:border-[rgba(195,197,217,0.12)] text-[#9D9D9D] opacity-50 cursor-not-allowed font-medium'
                }`}
              >
                <span>{district || 'Район'}</span>
                {dropdownChevron}
              </button>
              {activeDropdown === 'district' && hasDistricts && (
                <div className={dropdownListClass}>
                  {formMode === 'apartment' && (
                    <button
                      type="button"
                      onClick={() => handleDropdownSelect('district', 'Не важно')}
                      className={dropdownItemClass}
                    >
                      Не важно
                    </button>
                  )}
                  {currentCityData?.districts.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleDropdownSelect('district', d)}
                      className={dropdownItemClass}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Row 3: Возраст & Комнатность */}
            <div className="grid grid-cols-2 gap-3">
              {formMode === 'apartment' ? (
                /* Single Age Select for Apartment Mode */
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => toggleDropdown('ageFrom')}
                    className={dropdownToggleClass(!!errors.ageFrom, 'Возраст', ageFrom)}
                  >
                    <span className="truncate">{ageFrom || 'Возраст'}</span>
                    {dropdownChevron}
                  </button>
                  {activeDropdown === 'ageFrom' && (
                    <div className={dropdownListClass}>
                      {Array.from({ length: 35 }, (_, i) => `${16 + i} лет`).map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => {
                            setAgeFrom(a)
                            setAgeTo(a)
                            setErrors((prev) => ({ ...prev, ageFrom: false, ageTo: false }))
                            setActiveDropdown(null)
                          }}
                          className={dropdownItemClass}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Double Age Select for Roommate Mode */
                <div className="flex items-center gap-1.5">
                  {/* Age From */}
                  <div className="relative flex-1">
                    <button
                      type="button"
                      onClick={() => toggleDropdown('ageFrom')}
                      className={`w-full bg-white dark:bg-[#25262D] border rounded-2xl py-3 px-2.5 text-xs flex justify-between items-center gap-1 ${
                        errors.ageFrom ? 'border-[#FF3662]' : 'border-gray-200 dark:border-[rgba(195,197,217,0.12)]'
                      } ${ageFrom ? 'text-zinc-900 dark:text-white font-semibold' : 'text-[#9D9D9D] font-medium'}`}
                    >
                      <Mi name="cake" size={13} color="var(--on-surface-variant)" />
                      <span className="flex-1">{ageFrom || 'от'}</span>
                      <span className="text-[9px] text-[#9D9D9D]">▼</span>
                    </button>
                    {activeDropdown === 'ageFrom' && (
                      <div className={dropdownListClass}>
                        {Array.from(
                          { length: (ageTo ? parseInt(ageTo) : 50) - 16 + 1 },
                          (_, i) => (16 + i).toString()
                        ).map((a) => (
                          <button
                            key={a}
                            type="button"
                            onClick={() => handleDropdownSelect('ageFrom', a)}
                            className="w-full text-center py-2 px-3 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white"
                          >
                            {a}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Age To */}
                  <div className="relative flex-1">
                    <button
                      type="button"
                      onClick={() => toggleDropdown('ageTo')}
                      className={`w-full bg-white dark:bg-[#25262D] border rounded-2xl py-3 px-2.5 text-xs flex justify-between items-center ${
                        errors.ageTo ? 'border-[#FF3662]' : 'border-gray-200 dark:border-[rgba(195,197,217,0.12)]'
                      } ${ageTo ? 'text-zinc-900 dark:text-white font-semibold' : 'text-[#9D9D9D] font-medium'}`}
                    >
                      <span>{ageTo || 'до'}</span>
                      <span className="text-[9px] text-[#9D9D9D]">▼</span>
                    </button>
                    {activeDropdown === 'ageTo' && (
                      <div className={dropdownListClass}>
                        {Array.from(
                          { length: 50 - (ageFrom ? parseInt(ageFrom) : 16) + 1 },
                          (_, i) => ((ageFrom ? parseInt(ageFrom) : 16) + i).toString()
                        ).map((a) => (
                          <button
                            key={a}
                            type="button"
                            onClick={() => handleDropdownSelect('ageTo', a)}
                            className="w-full text-center py-2 px-3 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white"
                          >
                            {a}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Rooms */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('rooms')}
                  className={dropdownToggleClass(!!errors.rooms, 'Комната', rooms)}
                >
                  <span className="truncate">
                    {rooms || 'Комната'}
                  </span>
                  {dropdownChevron}
                </button>
                {activeDropdown === 'rooms' && (
                  <div className={dropdownListClass}>
                    {['1-комнатный', '2-комнатный', '3-комнатный', '4-комнатный', '5-комнатный', '6-комнатный', '7-комнатный', '8-комнатный', '9-комнатный', '10+-комнатный'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleDropdownSelect('rooms', r)}
                        className={dropdownItemClass}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Row 4: Mode-specific fields */}
            <div className="grid grid-cols-2 gap-3">
              {formMode === 'apartment' ? (
                <>
                  {/* Могу жить с */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => toggleDropdown('canLiveWith')}
                      className={dropdownToggleClass(!!errors.canLiveWith, 'Могу жить с', canLiveWith)}
                    >
                      <span className="truncate">{canLiveWith || 'Могу жить с'}</span>
                      {dropdownChevron}
                    </button>
                    {activeDropdown === 'canLiveWith' && (
                      <div className={dropdownListClass}>
                        {['Не важно', 'Только парни', 'Только девочки'].map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => handleDropdownSelect('canLiveWith', item)}
                            className={dropdownItemClass}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Нас: */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => toggleDropdown('peopleCount')}
                      className={dropdownToggleClass(!!errors.peopleCount, 'Нас:', peopleCount)}
                    >
                      <span className="truncate">{peopleCount ? `Нас: ${peopleCount}` : 'Нас:'}</span>
                      {dropdownChevron}
                    </button>
                    {activeDropdown === 'peopleCount' && (
                      <div className={dropdownListClass}>
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => handleDropdownSelect('peopleCount', c)}
                            className={dropdownItemClass}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Будет жить */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => toggleDropdown('peopleCount')}
                      className={dropdownToggleClass(!!errors.peopleCount, 'Будет жить', peopleCount)}
                    >
                      <span className="truncate">{peopleCount || 'Будет жить'}</span>
                      {dropdownChevron}
                    </button>
                    {activeDropdown === 'peopleCount' && (
                      <div className={dropdownListClass}>
                        {['Только парни', 'Только девочки', 'Не важно'].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => handleDropdownSelect('peopleCount', c)}
                            className={dropdownItemClass}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Ищу: */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => toggleDropdown('searchingCount')}
                      className={dropdownToggleClass(!!errors.searchingCount, 'Ищу:', searchingCount)}
                    >
                      <span className="truncate">{searchingCount ? `Ищу: ${searchingCount}` : 'Ищу:'}</span>
                      {dropdownChevron}
                    </button>
                    {activeDropdown === 'searchingCount' && (
                      <div className={dropdownListClass}>
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => handleDropdownSelect('searchingCount', c)}
                            className={dropdownItemClass}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Row 5: Mode-specific fields */}
            <div className="grid grid-cols-2 gap-3">
              {formMode === 'apartment' ? (
                <>
                  {/* Срок */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => toggleDropdown('term')}
                      className={dropdownToggleClass(!!errors.term, 'Срок', term)}
                    >
                      <span className="truncate">{term || 'Срок'}</span>
                      {dropdownChevron}
                    </button>
                    {activeDropdown === 'term' && (
                      <div className={dropdownListClass}>
                        {Array.from({ length: 12 }, (_, i) => `${i + 1} месяц`).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => handleDropdownSelect('term', t)}
                            className={dropdownItemClass}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Общий: */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => toggleDropdown('totalPeople')}
                      className={dropdownToggleClass(!!errors.totalPeople, 'Общий:', totalPeople)}
                    >
                      <span className="truncate">{totalPeople ? `Общий: ${totalPeople}` : 'Общий:'}</span>
                      {dropdownChevron}
                    </button>
                    {activeDropdown === 'totalPeople' && (
                      <div className={dropdownListClass}>
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => handleDropdownSelect('totalPeople', c)}
                            className={dropdownItemClass}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Общий: */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => toggleDropdown('totalPeople')}
                      className={dropdownToggleClass(!!errors.totalPeople, 'Общий:', totalPeople)}
                    >
                      <span className="truncate">{totalPeople ? `Общий: ${totalPeople}` : 'Общий:'}</span>
                      {dropdownChevron}
                    </button>
                    {activeDropdown === 'totalPeople' && (
                      <div className={dropdownListClass}>
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => handleDropdownSelect('totalPeople', c)}
                            className={dropdownItemClass}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Адрес ссылка (2GIS) - unique to roommate */}
                  <div className="flex flex-col">
                    <input
                      type="url"
                      placeholder="Адрес ссылка"
                      aria-label="Ссылка на адрес (2GIS)"
                      value={addressLink}
                      onChange={(e) => {
                        setAddressLink(e.target.value)
                        setErrors((prev) => ({ ...prev, addressLink: false }))
                      }}
                      className={`w-full bg-white dark:bg-[#25262D] border rounded-2xl py-3 px-4 text-xs text-zinc-900 dark:text-white font-medium focus:outline-none placeholder:text-[#9D9D9D] ${
                        errors.addressLink ? 'border-[#FF3662]' : 'border-gray-200 dark:border-[rgba(195,197,217,0.12)]'
                      }`}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Row 6: Депозит & Договор */}
            <div className="grid grid-cols-2 gap-3">
              {/* Deposit */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('deposit')}
                  className={dropdownToggleClass(!!errors.deposit, 'Депозит', deposit)}
                >
                  <span className="truncate">{deposit ? `Депозит: ${deposit}` : 'Депозит'}</span>
                  {dropdownChevron}
                </button>
                {activeDropdown === 'deposit' && (
                  <div className={dropdownListClass}>
                    {['Есть', 'Нет'].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => handleDropdownSelect('deposit', d)}
                        className={dropdownItemClass}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Contract */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('contract')}
                  className={dropdownToggleClass(!!errors.contract, 'Договор', contract)}
                >
                  <span className="truncate">{contract ? `Договор: ${contract}` : 'Договор'}</span>
                  {dropdownChevron}
                </button>
                {activeDropdown === 'contract' && (
                  <div className={dropdownListClass}>
                    {['Есть', 'Нет'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleDropdownSelect('contract', c)}
                        className={dropdownItemClass}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Row 7: Бюджет От & До */}
            <div className="grid grid-cols-2 gap-3">
              {/* Price From */}
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Бюджет от (₸)"
                  aria-label="Бюджет от, в тенге"
                  value={formatBudgetDisplay(priceFrom)}
                  onKeyDown={handleNumberKeyDown}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '')
                    setPriceFrom(raw)
                    const num = parseInt(raw || '0', 10)
                    setErrors((prev) => ({ ...prev, priceFrom: raw.length > 0 && num < 10000 }))
                  }}
                  className={`w-full bg-white dark:bg-[#25262D] border rounded-2xl py-3.5 px-4 text-xs text-zinc-900 dark:text-white font-semibold focus:outline-none placeholder:text-[#9D9D9D] transition-all duration-150 ${
                    errors.priceFrom ? 'border-[#FF3662]' : 'border-gray-200 dark:border-[rgba(195,197,217,0.12)]'
                  }`}
                />
              </div>

              {/* Price To */}
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Бюджет до (₸)"
                  aria-label="Бюджет до, в тенге"
                  value={formatBudgetDisplay(priceTo)}
                  onKeyDown={handleNumberKeyDown}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '')
                    setPriceTo(raw)
                    const num = parseInt(raw || '0', 10)
                    setErrors((prev) => ({ ...prev, priceTo: raw.length > 0 && num > 900000 }))
                  }}
                  className={`w-full bg-white dark:bg-[#25262D] border rounded-2xl py-3.5 px-4 text-xs text-zinc-900 dark:text-white font-semibold focus:outline-none placeholder:text-[#9D9D9D] transition-all duration-150 ${
                    errors.priceTo ? 'border-[#FF3662]' : 'border-gray-200 dark:border-[rgba(195,197,217,0.12)]'
                  }`}
                />
              </div>
            </div>

            {/* Row 8: +фото button */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Confirmed photos */}
              {photos.map((ph, idx) => (
                <div key={idx} className="relative w-16 h-16 rounded-2xl overflow-hidden border border-gray-200 dark:border-[rgba(195,197,217,0.12)] bg-zinc-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ph} className="w-full h-full object-cover object-center" alt="Preview" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center text-[10px] font-bold"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {/* Uploading previews with spinner */}
              {uploadingPreviews.map((preview, idx) => (
                <div key={`up-${idx}`} className="relative w-16 h-16 rounded-2xl overflow-hidden border border-gray-200 dark:border-[rgba(195,197,217,0.12)] bg-zinc-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} className="w-full h-full object-cover object-center opacity-50" alt="Загрузка" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  </div>
                </div>
              ))}

              {/* Upload button — hidden while uploading or at limit */}
              {(photos.length + uploadingPreviews.length) < (formMode === 'apartment' ? 3 : 5) && !isUploadingPhotos && (
                <div className={`relative w-16 h-16 border border-dashed rounded-2xl flex flex-col items-center justify-center bg-white dark:bg-[#25262D] hover:bg-zinc-50 cursor-pointer text-[#9D9D9D] ${
                  errors.photos ? 'border-[#FF3662]' : 'border-gray-300 dark:border-[rgba(195,197,217,0.12)]'
                }`}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Camera className="w-5 h-5 text-[#9D9D9D]" />
                  <span className="text-[9px] font-semibold mt-0.5">+фото</span>
                </div>
              )}
            </div>

            {/* Row 9: Описание (100%) */}
            <div>
              <textarea
                rows={4}
                placeholder="Описание"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value)
                  setErrors((prev) => ({ ...prev, description: false }))
                }}
                className={`w-full bg-white dark:bg-[#25262D] border rounded-2xl py-3.5 px-4 text-xs text-zinc-900 dark:text-white font-medium focus:outline-none placeholder:text-[#9D9D9D] leading-relaxed resize-none ${
                  errors.description ? 'border-[#FF3662]' : 'border-gray-200 dark:border-[rgba(195,197,217,0.12)]'
                }`}
              />
            </div>

            {/* Bottom Row: Phone (45%) & Submit Button (50%) */}
            <div className="flex justify-between items-center gap-3 mt-2 pt-3 border-t border-gray-200/60 dark:border-zinc-800">
              <div className="flex-[45] relative flex items-center">
                <span className="absolute left-4 font-bold text-zinc-900 dark:text-white text-xs z-10">+7</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="700 000 0000"
                  aria-label="Номер телефона"
                  value={formatPhoneDisplay(phone)}
                  onChange={handlePhoneChange}
                  className={`w-full bg-white dark:bg-[#25262D] border rounded-2xl py-3.5 pl-9 pr-3 text-xs text-zinc-900 dark:text-white font-semibold focus:outline-none placeholder:text-[#9D9D9D] ${
                    errors.phone ? 'border-[#FF3662]' : 'border-gray-200 dark:border-[rgba(195,197,217,0.12)]'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isUploadingPhotos || (userListingsCount >= 5 && user?.email !== 'n.erdaullet@gmail.com')}
                className="flex-[50] bg-[#007BFF] text-white rounded-2xl py-3.5 px-4 font-extrabold text-center flex items-center justify-center hover:bg-blue-600 active:scale-95 disabled:opacity-50 transition-all text-xs select-none shadow-sm uppercase tracking-wide"
              >
                {isUploadingPhotos ? 'Загрузка фото...' : isSubmitting ? 'Создание...' : `${publishPrice} ₸`}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  )
}
