'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import { Header } from '@/components/header'
import { CITIES_DATA } from '@/lib/constants'
import { useRouter } from 'next/navigation'
import { Camera, ShieldAlert } from 'lucide-react'

// Formatting helper for currency inputs (spaces as thousands separators)
function formatBudgetDisplay(val: string) {
  const digits = val.replace(/\D/g, '')
  if (!digits) return ''
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export default function AddListingPage() {
  const router = useRouter()
  const { user } = useAppStore()

  // Steps: 'select-type' | 'fill-form'
  const [step, setStep] = useState<'select-type' | 'fill-form'>('select-type')
  const [formMode, setFormMode] = useState<'apartment' | 'roommate'>('apartment')

  // Form Fields State
  const [city, setCity] = useState('Алматы')
  const [district, setDistrict] = useState('Не важно') // Default for apartment
  const [gender, setGender] = useState('любой')
  const [ageFrom, setAgeFrom] = useState('')
  const [ageTo, setAgeTo] = useState('')
  const [rooms, setRooms] = useState('1')
  const [canLiveWith, setCanLiveWith] = useState('все') // for apartment
  const [peopleCount, setPeopleCount] = useState('1') // "Нас" for apartment / "Будет жить" for roommate
  const [searchingCount, setSearchingCount] = useState('1') // "Ищу" for roommate / "Ищут" for apartment
  const [term, setTerm] = useState('длительно')
  const [totalPeople, setTotalPeople] = useState('2') // "Общий" count
  const [deposit, setDeposit] = useState('0')
  const [contract, setContract] = useState('yes')
  const [priceFrom, setPriceFrom] = useState('')
  const [priceTo, setPriceTo] = useState('')
  const [description, setDescription] = useState('')
  const [phone, setPhone] = useState('') // Masked digits only (length 10)
  const [addressLink, setAddressLink] = useState('') // 2GIS link for roommate
  const [photos, setPhotos] = useState<string[]>([]) // Array of Base64 strings

  // Dynamic Validation / Pricing Settings
  const [userListingsCount, setUserListingsCount] = useState(0)
  const [publishPrice, setPublishPrice] = useState(0)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  
  // Error borders state (field keys marked true get red borders)
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [submitErrorMsg, setSubmitErrorMsg] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Sync district based on city
  const currentCityData = CITIES_DATA.find((c) => c.city === city)
  const hasDistricts = currentCityData && currentCityData.districts.length > 0

  // Load user listings count and dynamic publish cost
  useEffect(() => {
    if (!user) {
      router.push('/profile')
      return
    }

    const loadMeta = async () => {
      try {
        // Count listings
        const { count, error: countError } = await supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', user.id)
          .eq('status', 'active')

        if (countError) throw countError
        setUserListingsCount(count || 0)

        // Publish Price
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
      setDistrict(nextHasDistricts ? (formMode === 'apartment' ? 'Не важно' : nextCityData.districts[0]) : '-')
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
    if (dropdown === 'ageFrom') setAgeFrom(val)
    if (dropdown === 'ageTo') setAgeTo(val)
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

  // Handle phone input changes (exactly 10 digits max)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '')
    let stripped = rawDigits
    if (rawDigits.startsWith('7') || rawDigits.startsWith('8')) {
      stripped = rawDigits.substring(1)
    }
    const limited = stripped.substring(0, 10)
    setPhone(limited)
    setErrors((prev) => ({ ...prev, phone: false }))
  }

  // Handle Photo selection (limit to 5 for apartment, 3 for roommate)
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const fileList = Array.from(e.target.files)
    const limit = formMode === 'apartment' ? 5 : 3
    const availableSlots = limit - photos.length

    if (availableSlots <= 0) {
      alert(`Максимум фотографий: ${limit}`)
      return
    }

    const filesToUpload = fileList.slice(0, availableSlots)
    filesToUpload.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (reader.result) {
          setPhotos((prev) => [...prev, reader.result as string])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemovePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSubmitErrorMsg('')
    const newErrors: Record<string, boolean> = {}

    // Exceeded listings limit check
    if (userListingsCount >= 5) {
      setSubmitErrorMsg('Достигнут лимит (максимум 5 объявлений). Чтобы опубликовать новое, удалите одно из старых.')
      return
    }

    // Common Validation
    if (!priceFrom) newErrors.priceFrom = true
    if (!priceTo) newErrors.priceTo = true
    if (!ageFrom) newErrors.ageFrom = true
    if (!ageTo) newErrors.ageTo = true
    if (!phone || phone.length < 10) newErrors.phone = true
    if (!description || description.trim().length < 10) newErrors.description = true

    // Mode-specific validation
    if (formMode === 'roommate') {
      if (!addressLink) {
        newErrors.addressLink = true
      } else {
        const is2gisLink = /2gis\.(?:kz|ru)/i.test(addressLink)
        if (!is2gisLink) {
          newErrors.addressLink = true
          setSubmitErrorMsg('Неверный формат ссылки 2GIS. Ссылка должна содержать домен 2gis.kz или 2gis.ru')
        }
      }
    }

    // If validation fails
    if (Object.keys(newErrors).length > 0 || submitErrorMsg) {
      setErrors(newErrors)
      if (!submitErrorMsg) setSubmitErrorMsg('Пожалуйста, заполните выделенные обязательные поля корректно.')
      return
    }

    setIsSubmitting(true)
    
    // Build insert payload
    const payload = {
      owner_id: user.id,
      mode: formMode,
      city,
      district: hasDistricts && district !== 'Не важно' && district !== '-' ? district : null,
      gender,
      age_from: parseInt(ageFrom),
      age_to: parseInt(ageTo),
      rooms,
      can_live_with: formMode === 'apartment' ? canLiveWith : null,
      people_count: parseInt(peopleCount),
      searching_count: parseInt(searchingCount),
      term,
      total_people: parseInt(totalPeople),
      deposit: parseInt(deposit) || 0,
      contract,
      price_from: parseInt(priceFrom),
      price_to: parseInt(priceTo),
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

      router.push('/profile')
    } catch (err) {
      console.error('Error submitting listing:', err)
      const errorMsg = err instanceof Error ? err.message : 'Ошибка сервера при создании объявления.'
      setSubmitErrorMsg(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format phone output for visual convenience
  const formatPhoneDisplay = (val: string) => {
    if (!val) return ''
    const match = val.match(/^(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})$/)
    if (!match) return val
    let res = ''
    if (match[1]) res += `(${match[1]}`
    if (match[2]) res += `) ${match[2]}`
    if (match[3]) res += `-${match[3]}`
    if (match[4]) res += `-${match[4]}`
    return res
  }

  // Common dropdown styles
  const dropdownToggleClass = (err: boolean) =>
    `w-full bg-white dark:bg-brand-card-dark border rounded-2xl py-3 px-4 text-left text-brand-black dark:text-brand-white font-bold flex justify-between items-center ${
      err ? 'border-brand-red' : 'border-gray-200 dark:border-zinc-800'
    }`

  const dropdownListClass = "absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-brand-card-dark border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl max-h-48 overflow-y-auto"
  const dropdownItemClass = "w-full text-left py-2.5 px-4 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-brand-black dark:text-brand-white"

  return (
    <div className="flex flex-col w-full h-full">
      {/* Dynamic Header */}
      <Header
        type="title"
        title={step === 'select-type' ? 'объявление' : formMode === 'apartment' ? 'ищу квартиру' : 'ищу соседа'}
        showBack={step === 'fill-form'}
        showHelpToggle={false}
      />

      <div className="flex-1 px-5 py-5 overflow-y-auto">
        
        {/* STEP 1: Select Type */}
        {step === 'select-type' && (
          <div className="h-full flex flex-col justify-center items-center select-none py-10">
            <div className="bg-white dark:bg-brand-card-dark border border-gray-200/80 dark:border-zinc-800/80 rounded-3xl p-6 shadow-xs w-full text-center">
              <h2 className="text-sm font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-5">
                Выберите тип объявления
              </h2>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setFormMode('apartment')
                    const nextCityData = CITIES_DATA.find((c) => c.city === city)
                    const nextHasDistricts = nextCityData && nextCityData.districts.length > 0
                    setDistrict(nextHasDistricts ? 'Не важно' : '-')
                    setStep('fill-form')
                  }}
                  className="w-full bg-[#007BFF] text-white rounded-2xl py-4 font-bold text-center hover:bg-blue-600 active:scale-98 transition-all"
                >
                  Я ищу квартиру
                </button>
                <button
                  onClick={() => {
                    setFormMode('roommate')
                    const nextCityData = CITIES_DATA.find((c) => c.city === city)
                    const nextHasDistricts = nextCityData && nextCityData.districts.length > 0
                    setDistrict(nextHasDistricts ? nextCityData.districts[0] : '-')
                    setStep('fill-form')
                  }}
                  className="w-full bg-blue-50 dark:bg-zinc-800 text-[#007BFF] dark:text-white rounded-2xl py-4 font-bold text-center hover:bg-blue-100 dark:hover:bg-zinc-700 active:scale-98 transition-all"
                >
                  Я ищу соседа
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Fill Form */}
        {step === 'fill-form' && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs font-semibold select-none">
            
            {/* Warning block if near limit */}
            {userListingsCount >= 5 && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed text-amber-800 dark:text-amber-300">
                <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
                <span>
                  Вы исчерпали лимит в 5 объявлений. Кнопка отправки заблокирована. Удалите старое объявление, чтобы создать новое.
                </span>
              </div>
            )}

            {/* Error banner */}
            {submitErrorMsg && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-brand-red rounded-2xl p-4 flex gap-3 leading-relaxed">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <span>{submitErrorMsg}</span>
              </div>
            )}

            {/* Row 1: Город (50%) & Пол (50%) */}
            <div className="grid grid-cols-2 gap-3">
              {/* City */}
              <div className="relative">
                <label className="block text-brand-gray text-[10px] uppercase mb-1">Город</label>
                <button
                  type="button"
                  onClick={() => toggleDropdown('city')}
                  className={dropdownToggleClass(errors.city)}
                >
                  <span>{city}</span>
                  <span className="text-[10px] text-brand-gray">▼</span>
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

              {/* Gender */}
              <div className="relative">
                <label className="block text-brand-gray text-[10px] uppercase mb-1">
                  {formMode === 'apartment' ? 'Ваш пол' : 'Ищу сожителя'}
                </label>
                <button
                  type="button"
                  onClick={() => toggleDropdown('gender')}
                  className={dropdownToggleClass(errors.gender)}
                >
                  <span>{gender}</span>
                  <span className="text-[10px] text-brand-gray">▼</span>
                </button>
                {activeDropdown === 'gender' && (
                  <div className={dropdownListClass}>
                    {['любой', 'мужской', 'женский'].map((g) => (
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
              <label className="block text-brand-gray text-[10px] uppercase mb-1">Район</label>
              <button
                type="button"
                disabled={!hasDistricts}
                onClick={() => toggleDropdown('district')}
                className={`w-full border rounded-2xl py-3 px-4 text-left font-bold flex justify-between items-center transition-all ${
                  hasDistricts
                    ? errors.district
                      ? 'border-brand-red bg-white dark:bg-brand-card-dark text-brand-black dark:text-brand-white'
                      : 'bg-white dark:bg-brand-card-dark border-gray-200 dark:border-zinc-800 text-brand-black dark:text-brand-white'
                    : 'bg-zinc-150 dark:bg-zinc-850 border-zinc-200 dark:border-zinc-800 text-brand-gray opacity-50 cursor-not-allowed'
                }`}
              >
                <span>{district}</span>
                <span className="text-[10px] text-brand-gray">▼</span>
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

            {/* Row 3: Возраст (🎂 от и до) & Комната (50%) */}
            <div className="grid grid-cols-2 gap-3">
              {/* Age dropdown selectors */}
              <div className="flex flex-col">
                <label className="block text-brand-gray text-[10px] uppercase mb-1">
                  🎂 Возраст ({formMode === 'apartment' ? 'Ваш' : 'сожителя'})
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => toggleDropdown('ageFrom')}
                      className={`w-full bg-white dark:bg-brand-card-dark border rounded-2xl py-3 text-center text-brand-black dark:text-brand-white font-bold flex justify-between items-center px-3.5 ${
                        errors.ageFrom ? 'border-brand-red' : 'border-gray-200 dark:border-zinc-800'
                      }`}
                    >
                      <span>{ageFrom || 'от'}</span>
                      <span className="text-[9px] text-[#9D9D9D]">▼</span>
                    </button>
                    {activeDropdown === 'ageFrom' && (
                      <div className={dropdownListClass}>
                        {Array.from({ length: 45 }, (_, i) => (16 + i).toString()).map((a) => (
                          <button
                            key={a}
                            type="button"
                            onClick={() => handleDropdownSelect('ageFrom', a)}
                            className="w-full text-center py-2 px-3 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-brand-black dark:text-brand-white"
                          >
                            {a}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => toggleDropdown('ageTo')}
                      className={`w-full bg-white dark:bg-brand-card-dark border rounded-2xl py-3 text-center text-brand-black dark:text-brand-white font-bold flex justify-between items-center px-3.5 ${
                        errors.ageTo ? 'border-brand-red' : 'border-gray-200 dark:border-zinc-800'
                      }`}
                    >
                      <span>{ageTo || 'до'}</span>
                      <span className="text-[9px] text-[#9D9D9D]">▼</span>
                    </button>
                    {activeDropdown === 'ageTo' && (
                      <div className={dropdownListClass}>
                        {Array.from({ length: 45 }, (_, i) => (16 + i).toString()).map((a) => (
                          <button
                            key={a}
                            type="button"
                            onClick={() => handleDropdownSelect('ageTo', a)}
                            className="w-full text-center py-2 px-3 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-brand-black dark:text-brand-white"
                          >
                            {a}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Rooms select */}
              <div className="relative">
                <label className="block text-brand-gray text-[10px] uppercase mb-1">Комнатность</label>
                <button
                  type="button"
                  onClick={() => toggleDropdown('rooms')}
                  className={dropdownToggleClass(errors.rooms)}
                >
                  <span>{rooms} комната</span>
                  <span className="text-[10px] text-brand-gray">▼</span>
                </button>
                {activeDropdown === 'rooms' && (
                  <div className={dropdownListClass}>
                    {['1', '2', '3', '4+'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleDropdownSelect('rooms', r)}
                        className={dropdownItemClass}
                      >
                        {r} комната
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Row 4: С кем могу жить / Будет жить & Нас / Ищу */}
            <div className="grid grid-cols-2 gap-3">
              {formMode === 'apartment' ? (
                /* Apartment mode: с кем могу жить & нас */
                <>
                  <div className="relative">
                    <label className="block text-brand-gray text-[10px] uppercase mb-1">С кем могу жить</label>
                    <button
                      type="button"
                      onClick={() => toggleDropdown('canLiveWith')}
                      className={dropdownToggleClass(false)}
                    >
                      <span>{canLiveWith}</span>
                      <span className="text-[10px] text-brand-gray">▼</span>
                    </button>
                    {activeDropdown === 'canLiveWith' && (
                      <div className={dropdownListClass}>
                        {['все', 'парни', 'девушки', 'семейная пара'].map((item) => (
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

                  <div className="relative">
                    <label className="block text-brand-gray text-[10px] uppercase mb-1">Нас: человек</label>
                    <button
                      type="button"
                      onClick={() => toggleDropdown('peopleCount')}
                      className={dropdownToggleClass(false)}
                    >
                      <span>{peopleCount} чел.</span>
                      <span className="text-[10px] text-brand-gray">▼</span>
                    </button>
                    {activeDropdown === 'peopleCount' && (
                      <div className={dropdownListClass}>
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => handleDropdownSelect('peopleCount', c)}
                            className={dropdownItemClass}
                          >
                            {c} чел.
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Roommate mode: будет жить & ищу */
                <>
                  <div className="relative">
                    <label className="block text-brand-gray text-[10px] uppercase mb-1">Будет жить: чел.</label>
                    <button
                      type="button"
                      onClick={() => toggleDropdown('peopleCount')}
                      className={dropdownToggleClass(false)}
                    >
                      <span>{peopleCount} чел.</span>
                      <span className="text-[10px] text-brand-gray">▼</span>
                    </button>
                    {activeDropdown === 'peopleCount' && (
                      <div className={dropdownListClass}>
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => handleDropdownSelect('peopleCount', c)}
                            className={dropdownItemClass}
                          >
                            {c} чел.
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block text-brand-gray text-[10px] uppercase mb-1">Ищу: сожителей</label>
                    <button
                      type="button"
                      onClick={() => toggleDropdown('searchingCount')}
                      className={dropdownToggleClass(false)}
                    >
                      <span>{searchingCount} чел.</span>
                      <span className="text-[10px] text-brand-gray">▼</span>
                    </button>
                    {activeDropdown === 'searchingCount' && (
                      <div className={dropdownListClass}>
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => handleDropdownSelect('searchingCount', c)}
                            className={dropdownItemClass}
                          >
                            {c} чел.
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Row 5: Срок & Общий (apartment) OR Общий & Адрес ссылка (roommate) */}
            <div className="grid grid-cols-2 gap-3">
              {formMode === 'apartment' ? (
                <>
                  <div className="relative">
                    <label className="block text-brand-gray text-[10px] uppercase mb-1">Срок</label>
                    <button
                      type="button"
                      onClick={() => toggleDropdown('term')}
                      className={dropdownToggleClass(false)}
                    >
                      <span>{term}</span>
                      <span className="text-[10px] text-brand-gray">▼</span>
                    </button>
                    {activeDropdown === 'term' && (
                      <div className={dropdownListClass}>
                        {['длительно', 'посуточно', 'на пару месяцев'].map((t) => (
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

                  <div className="relative">
                    <label className="block text-brand-gray text-[10px] uppercase mb-1">Общий: человек</label>
                    <button
                      type="button"
                      onClick={() => toggleDropdown('totalPeople')}
                      className={dropdownToggleClass(false)}
                    >
                      <span>{totalPeople} чел.</span>
                      <span className="text-[10px] text-brand-gray">▼</span>
                    </button>
                    {activeDropdown === 'totalPeople' && (
                      <div className={dropdownListClass}>
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => handleDropdownSelect('totalPeople', c)}
                            className={dropdownItemClass}
                          >
                            {c} чел.
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Roommate unique layouts: Общий & Адрес ссылка (strictly validated) */
                <>
                  <div className="relative">
                    <label className="block text-brand-gray text-[10px] uppercase mb-1">Общий: человек</label>
                    <button
                      type="button"
                      onClick={() => toggleDropdown('totalPeople')}
                      className={dropdownToggleClass(false)}
                    >
                      <span>{totalPeople} чел.</span>
                      <span className="text-[10px] text-brand-gray">▼</span>
                    </button>
                    {activeDropdown === 'totalPeople' && (
                      <div className={dropdownListClass}>
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => handleDropdownSelect('totalPeople', c)}
                            className={dropdownItemClass}
                          >
                            {c} чел.
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <label className="block text-brand-gray text-[10px] uppercase mb-1">Адрес ссылка (2GIS)</label>
                    <input
                      type="text"
                      placeholder="https://2gis.kz/..."
                      value={addressLink}
                      onChange={(e) => {
                        setAddressLink(e.target.value)
                        setErrors((prev) => ({ ...prev, addressLink: false }))
                      }}
                      className={`w-full bg-white dark:bg-brand-card-dark border rounded-2xl py-3 px-4 text-brand-black dark:text-brand-white font-bold focus:outline-none ${
                        errors.addressLink ? 'border-brand-red' : 'border-gray-200 dark:border-zinc-800'
                      }`}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Row 6: Депозит & Договор */}
            <div className="grid grid-cols-2 gap-3">
              {/* Deposit Dropdown */}
              <div className="relative">
                <label className="block text-brand-gray text-[10px] uppercase mb-1">Депозит</label>
                <button
                  type="button"
                  onClick={() => toggleDropdown('deposit')}
                  className={dropdownToggleClass(false)}
                >
                  <span>{deposit === '0' ? 'без депозита' : `${formatBudgetDisplay(deposit)} ₸`}</span>
                  <span className="text-[10px] text-brand-gray">▼</span>
                </button>
                {activeDropdown === 'deposit' && (
                  <div className={dropdownListClass}>
                    {[0, 30000, 50000, 70000, 100000, 150000, 200000, 250000, 300000, 400000, 500000, 600000, 700000, 800000, 900000, 1000000].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => handleDropdownSelect('deposit', d.toString())}
                        className={dropdownItemClass}
                      >
                        {d === 0 ? 'без депозита' : `${formatBudgetDisplay(d.toString())} ₸`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Contract */}
              <div className="relative">
                <label className="block text-brand-gray text-[10px] uppercase mb-1">Официальный договор</label>
                <button
                  type="button"
                  onClick={() => toggleDropdown('contract')}
                  className={dropdownToggleClass(false)}
                >
                  <span>{contract === 'yes' ? 'да' : 'нет'}</span>
                  <span className="text-[10px] text-brand-gray">▼</span>
                </button>
                {activeDropdown === 'contract' && (
                  <div className={dropdownListClass}>
                    <button
                      type="button"
                      onClick={() => handleDropdownSelect('contract', 'yes')}
                      className={dropdownItemClass}
                    >
                      да
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDropdownSelect('contract', 'no')}
                      className={dropdownItemClass}
                    >
                      нет
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Row 7: Бюджет От & Бюджет До */}
            <div className="grid grid-cols-2 gap-3">
              {/* Budget From Dropdown */}
              <div className="relative">
                <label className="block text-brand-gray text-[10px] uppercase mb-1">Бюджет От (₸)</label>
                <button
                  type="button"
                  onClick={() => toggleDropdown('priceFrom')}
                  className={dropdownToggleClass(errors.priceFrom)}
                >
                  <span>{priceFrom ? `${formatBudgetDisplay(priceFrom)} ₸` : 'от'}</span>
                  <span className="text-[10px] text-brand-gray">▼</span>
                </button>
                {activeDropdown === 'priceFrom' && (
                  <div className={dropdownListClass}>
                    {[20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000, 110000, 120000, 130000, 140000, 150000, 160000, 170000, 180000, 190000, 200000, 220000, 250000, 270000, 300000, 350000, 400000, 450000, 500000, 600000, 700000, 800000, 900000, 1000000].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handleDropdownSelect('priceFrom', p.toString())}
                        className={dropdownItemClass}
                      >
                        {formatBudgetDisplay(p.toString())} ₸
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Budget To Dropdown */}
              <div className="relative">
                <label className="block text-brand-gray text-[10px] uppercase mb-1">Бюджет До (₸)</label>
                <button
                  type="button"
                  onClick={() => toggleDropdown('priceTo')}
                  className={dropdownToggleClass(errors.priceTo)}
                >
                  <span>{priceTo ? `${formatBudgetDisplay(priceTo)} ₸` : 'до'}</span>
                  <span className="text-[10px] text-brand-gray">▼</span>
                </button>
                {activeDropdown === 'priceTo' && (
                  <div className={dropdownListClass}>
                    {[20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000, 110000, 120000, 130000, 140000, 150000, 160000, 170000, 180000, 190000, 200000, 220000, 250000, 270000, 300000, 350000, 400000, 450000, 500000, 600000, 700000, 800000, 900000, 1000000].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handleDropdownSelect('priceTo', p.toString())}
                        className={dropdownItemClass}
                      >
                        {formatBudgetDisplay(p.toString())} ₸
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Row 8: + фото uploader */}
            <div className="flex flex-col gap-2.5">
              <label className="block text-brand-gray text-[10px] uppercase">
                Фотографии (загружено {photos.length} из {formMode === 'apartment' ? 5 : 3})
              </label>
              
              <div className="flex flex-wrap gap-2 items-center">
                {/* Thumbnails preview */}
                {photos.map((ph, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-800 bg-zinc-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ph} className="w-full h-full object-cover" alt="Preview" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1 right-1 w-4.5 h-4.5 rounded-full bg-black/60 text-white flex items-center justify-center text-[10px] font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {/* Upload icon button (approx 35% width, or simple container) */}
                {photos.length < (formMode === 'apartment' ? 5 : 3) && (
                  <div className="relative w-16 h-16 border border-dashed border-gray-300 dark:border-zinc-800 rounded-xl flex items-center justify-center bg-white dark:bg-brand-card-dark hover:bg-zinc-50 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoSelect}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Camera className="w-5 h-5 text-brand-blue" />
                  </div>
                )}
              </div>
            </div>

            {/* Row 9: Описание (100%) */}
            <div className="flex flex-col">
              <label className="block text-brand-gray text-[10px] uppercase mb-1">Описание объявления</label>
              <textarea
                rows={4}
                placeholder="Расскажите подробнее о себе, сожителях, квартире и бытовых условиях..."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value)
                  setErrors((prev) => ({ ...prev, description: false }))
                }}
                className={`w-full bg-white dark:bg-brand-card-dark border rounded-2xl py-3.5 px-4 text-brand-black dark:text-brand-white focus:outline-none font-medium leading-relaxed resize-none ${
                  errors.description ? 'border-brand-red' : 'border-gray-200 dark:border-zinc-800'
                }`}
              />
            </div>

            {/* Bottom Row: Phone Mask (45%) & Publish Button (50%) */}
            <div className="flex justify-between items-end gap-3 mt-4 pt-2 border-t border-gray-150 dark:border-zinc-850">
              
              <div className="w-[45%] flex flex-col">
                <label className="block text-brand-gray text-[10px] uppercase mb-1">Телефон</label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 font-bold text-brand-black dark:text-brand-white text-sm">+7</span>
                  <input
                    type="text"
                    placeholder=" (707) 123-4567"
                    value={formatPhoneDisplay(phone)}
                    onChange={handlePhoneChange}
                    className={`w-full bg-white dark:bg-brand-card-dark border rounded-2xl py-3.5 pl-10 pr-3 text-brand-black dark:text-brand-white font-bold text-sm focus:outline-none ${
                      errors.phone ? 'border-brand-red' : 'border-gray-200 dark:border-zinc-800'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || userListingsCount >= 5}
                className="w-[50%] bg-[#007BFF] text-white rounded-2xl py-3.5 px-4 font-extrabold text-center flex items-center justify-center hover:bg-blue-600 active:scale-95 disabled:opacity-50 transition-all text-sm select-none shadow-xs"
              >
                {isSubmitting ? 'Создание...' : `${publishPrice} ₸`}
              </button>

            </div>

          </form>
        )}

      </div>
    </div>
  )
}
