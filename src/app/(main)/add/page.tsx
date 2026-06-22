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
  const [deposit, setDeposit] = useState('0')
  const [contract, setContract] = useState('yes')
  const [priceFrom, setPriceFrom] = useState('')
  const [priceTo, setPriceTo] = useState('')
  const [description, setDescription] = useState('')
  const [phone, setPhone] = useState('') // Raw 10-digit string
  const [addressLink, setAddressLink] = useState('') // 2GIS link for roommate
  const [photos, setPhotos] = useState<string[]>([]) // Array of Base64 strings

  // Dynamic Validation / Pricing Settings
  const [userListingsCount, setUserListingsCount] = useState(0)
  const [publishPrice, setPublishPrice] = useState(0)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  // Error borders state
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

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrors((prev) => ({ ...prev, photos: false }))
    if (!e.target.files) return
    const fileList = Array.from(e.target.files)
    const limit = formMode === 'apartment' ? 5 : 3
    const availableSlots = limit - photos.length

    if (availableSlots <= 0) return

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

    if (userListingsCount >= 5) {
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

    if (!priceFrom) newErrors.priceFrom = true
    if (!priceTo) newErrors.priceTo = true
    if (priceFrom && priceTo && parseInt(priceFrom) > parseInt(priceTo)) {
      newErrors.priceFrom = true
      newErrors.priceTo = true
      setSubmitErrorMsg('Минимальный бюджет (от) не может быть больше максимального (до).')
    }

    if (!ageFrom) newErrors.ageFrom = true
    if (!ageTo) newErrors.ageTo = true
    if (ageFrom && ageTo && parseInt(ageFrom) > parseInt(ageTo)) {
      newErrors.ageFrom = true
      newErrors.ageTo = true
      setSubmitErrorMsg('Минимальный возраст (от) не может быть больше максимального (до).')
    }

    if (!phone || phone.length < 10) newErrors.phone = true
    if (!description || description.trim().length < 10) newErrors.description = true

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

    // Photo limits validation
    if (formMode === 'apartment') {
      if (photos.length < 3 || photos.length > 5) {
        newErrors.photos = true
        setSubmitErrorMsg('Для квартиры необходимо добавить от 3 до 5 фотографий.')
      }
    } else {
      if (photos.length > 3) {
        newErrors.photos = true
        setSubmitErrorMsg('Для соседа можно добавить не более 3 фотографий.')
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
      gender: gender || 'любой',
      age_from: parseInt(ageFrom),
      age_to: parseInt(ageTo),
      rooms: rooms || '1',
      can_live_with: formMode === 'apartment' ? (canLiveWith || 'все') : null,
      people_count: parseInt(peopleCount) || 1,
      searching_count: parseInt(searchingCount) || 1,
      term: term || 'длительно',
      total_people: parseInt(totalPeople) || 1,
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

  // Format phone for display
  const formatPhoneDisplay = (val: string) => {
    if (!val) return ''
    const match = val.match(/^(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})$/)
    if (!match) return val
    let res = ''
    if (match[1]) res += `${match[1]}`
    if (match[2]) res += ` ${match[2]}`
    if (match[3]) res += ` ${match[3]}`
    if (match[4]) res += ` ${match[4]}`
    return res.trim()
  }

  // Common dropdown styles (matching Figma design exactly)
  const dropdownToggleClass = (err: boolean, placeholder?: string, value?: string) =>
    `w-full bg-white dark:bg-[#313131] border rounded-2xl py-3 px-4 text-left flex justify-between items-center transition-all duration-150 ${
      err ? 'border-[#FF3662]' : 'border-gray-200 dark:border-zinc-700'
    } ${value ? 'text-zinc-900 dark:text-white font-semibold text-xs' : 'text-[#9D9D9D] font-medium text-xs'}`

  const dropdownListClass = "absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-700 rounded-2xl shadow-xl max-h-48 overflow-y-auto"
  const dropdownItemClass = "w-full text-left py-2.5 px-4 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white"
  const dropdownChevron = <span className="text-[10px] text-[#9D9D9D] shrink-0">▼</span>

  return (
    <div className="flex flex-col w-full h-full">
      {/* Dynamic Header */}
      <Header
        type="title"
        title={step === 'select-type' ? 'объявление' : formMode === 'apartment' ? 'ищу квартиру' : 'ищу соседа'}
        showBack={step === 'fill-form'}
        showHelpToggle={true}
      />

      <div className="flex-1 px-5 py-5 overflow-y-auto pb-24">

        {/* STEP 1: Select Type */}
        {step === 'select-type' && (
          <div className="h-full flex flex-col justify-center items-center select-none py-10">
            <div className="bg-white dark:bg-[#313131] border border-gray-200/80 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm w-full text-center">
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
                  className="w-full bg-blue-50 dark:bg-zinc-800 text-[#007BFF] dark:text-white rounded-2xl py-4 font-bold text-center hover:bg-blue-100 dark:hover:bg-zinc-700 active:scale-[0.98] transition-all"
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
                  className={dropdownToggleClass(false, 'Пол', gender)}
                >
                  <span className="truncate">{gender || 'Пол'}</span>
                  {dropdownChevron}
                </button>
                {activeDropdown === 'gender' && (
                  <div className={dropdownListClass}>
                    {(formMode === 'apartment'
                      ? ['любой', 'парень', 'девушка']
                      : ['парень', 'девушка', 'семейная пара']
                    ).map((g) => (
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
                      ? 'border-[#FF3662] bg-white dark:bg-[#313131] text-zinc-900 dark:text-white font-semibold'
                      : district
                        ? 'bg-white dark:bg-[#313131] border-gray-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-semibold'
                        : 'bg-white dark:bg-[#313131] border-gray-200 dark:border-zinc-700 text-[#9D9D9D] font-medium'
                    : 'bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-[#9D9D9D] opacity-50 cursor-not-allowed font-medium'
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

            {/* Row 3: Возраст (🎂 от & до) & Комнатность */}
            <div className="grid grid-cols-2 gap-3">
              {/* Age selectors block */}
              <div className="flex items-center gap-1.5">
                <span className="text-sm shrink-0">🎂</span>
                {/* Age From */}
                <div className="relative flex-1">
                  <button
                    type="button"
                    onClick={() => toggleDropdown('ageFrom')}
                    className={`w-full bg-white dark:bg-[#313131] border rounded-2xl py-3 px-2.5 text-xs flex justify-between items-center ${
                      errors.ageFrom ? 'border-[#FF3662]' : 'border-gray-200 dark:border-zinc-700'
                    } ${ageFrom ? 'text-zinc-900 dark:text-white font-semibold' : 'text-[#9D9D9D] font-medium'}`}
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
                    className={`w-full bg-white dark:bg-[#313131] border rounded-2xl py-3 px-2.5 text-xs flex justify-between items-center ${
                      errors.ageTo ? 'border-[#FF3662]' : 'border-gray-200 dark:border-zinc-700'
                    } ${ageTo ? 'text-zinc-900 dark:text-white font-semibold' : 'text-[#9D9D9D] font-medium'}`}
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
                          className="w-full text-center py-2 px-3 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white"
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Rooms */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('rooms')}
                  className={dropdownToggleClass(false, 'Комната', rooms)}
                >
                  <span className="truncate">{rooms ? `${rooms}-комн.` : 'Комната'}</span>
                  {dropdownChevron}
                </button>
                {activeDropdown === 'rooms' && (
                  <div className={dropdownListClass}>
                    {['1', '2', '3', '4', '5+'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleDropdownSelect('rooms', r)}
                        className={dropdownItemClass}
                      >
                        {r}-комнатная
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
                      className={dropdownToggleClass(false, 'Могу жить с', canLiveWith)}
                    >
                      <span className="truncate">{canLiveWith || 'Могу жить с'}</span>
                      {dropdownChevron}
                    </button>
                    {activeDropdown === 'canLiveWith' && (
                      <div className={dropdownListClass}>
                        {['все', 'Только парни', 'Только девочки', 'семейная пара'].map((item) => (
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
                      className={dropdownToggleClass(false, 'Нас:', peopleCount)}
                    >
                      <span className="truncate">{peopleCount ? `Нас: ${peopleCount}` : 'Нас:'}</span>
                      {dropdownChevron}
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
                      className={dropdownToggleClass(false, 'Будет жить', peopleCount)}
                    >
                      <span className="truncate">{peopleCount ? `Будет жить ${peopleCount}` : 'Будет жить'}</span>
                      {dropdownChevron}
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
                      className={dropdownToggleClass(false, 'Ищу:', searchingCount)}
                    >
                      <span className="truncate">{searchingCount ? `Ищу: ${searchingCount}` : 'Ищу:'}</span>
                      {dropdownChevron}
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
                      className={dropdownToggleClass(false, 'Срок', term)}
                    >
                      <span className="truncate">{term || 'Срок'}</span>
                      {dropdownChevron}
                    </button>
                    {activeDropdown === 'term' && (
                      <div className={dropdownListClass}>
                        {['длительно', 'посуточно', '1 месяц', '2 месяца', '3 месяца', '6 месяцев', '9 месяцев', '1 год'].map((t) => (
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
                      className={dropdownToggleClass(false, 'Общий:', totalPeople)}
                    >
                      <span className="truncate">{totalPeople ? `Общий: ${totalPeople}` : 'Общий:'}</span>
                      {dropdownChevron}
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
                      className={dropdownToggleClass(false, 'Общий:', totalPeople)}
                    >
                      <span className="truncate">{totalPeople ? `Общий: ${totalPeople}` : 'Общий:'}</span>
                      {dropdownChevron}
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
                      value={addressLink}
                      onChange={(e) => {
                        setAddressLink(e.target.value)
                        setErrors((prev) => ({ ...prev, addressLink: false }))
                      }}
                      className={`w-full bg-white dark:bg-[#313131] border rounded-2xl py-3 px-4 text-xs text-zinc-900 dark:text-white font-medium focus:outline-none placeholder:text-[#9D9D9D] ${
                        errors.addressLink ? 'border-[#FF3662]' : 'border-gray-200 dark:border-zinc-700'
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
                  className={dropdownToggleClass(false, 'Депозит', deposit)}
                >
                  <span className="truncate">{deposit === '0' ? 'Депозит' : `${formatBudgetDisplay(deposit)} ₸`}</span>
                  {dropdownChevron}
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
                <button
                  type="button"
                  onClick={() => toggleDropdown('contract')}
                  className={dropdownToggleClass(false, 'Договор', contract)}
                >
                  <span className="truncate">{contract === 'yes' ? 'Договор есть' : 'Без договора'}</span>
                  {dropdownChevron}
                </button>
                {activeDropdown === 'contract' && (
                  <div className={dropdownListClass}>
                    <button
                      type="button"
                      onClick={() => handleDropdownSelect('contract', 'yes')}
                      className={dropdownItemClass}
                    >
                      Договор есть
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDropdownSelect('contract', 'no')}
                      className={dropdownItemClass}
                    >
                      Без договора
                    </button>
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
                  value={formatBudgetDisplay(priceFrom)}
                  onKeyDown={handleNumberKeyDown}
                  onChange={(e) => {
                    setPriceFrom(e.target.value.replace(/\D/g, ''))
                    setErrors((prev) => ({ ...prev, priceFrom: false }))
                  }}
                  className={`w-full bg-white dark:bg-[#313131] border rounded-2xl py-3.5 px-4 text-xs text-zinc-900 dark:text-white font-semibold focus:outline-none placeholder:text-[#9D9D9D] transition-all duration-150 ${
                    errors.priceFrom ? 'border-[#FF3662]' : 'border-gray-200 dark:border-zinc-700'
                  }`}
                />
              </div>

              {/* Price To */}
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Бюджет до (₸)"
                  value={formatBudgetDisplay(priceTo)}
                  onKeyDown={handleNumberKeyDown}
                  onChange={(e) => {
                    setPriceTo(e.target.value.replace(/\D/g, ''))
                    setErrors((prev) => ({ ...prev, priceTo: false }))
                  }}
                  className={`w-full bg-white dark:bg-[#313131] border rounded-2xl py-3.5 px-4 text-xs text-zinc-900 dark:text-white font-semibold focus:outline-none placeholder:text-[#9D9D9D] transition-all duration-150 ${
                    errors.priceTo ? 'border-[#FF3662]' : 'border-gray-200 dark:border-zinc-700'
                  }`}
                />
              </div>
            </div>

            {/* Row 8: +фото button */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Thumbnails preview */}
              {photos.map((ph, idx) => (
                <div key={idx} className="relative w-16 h-16 rounded-2xl overflow-hidden border border-gray-200 dark:border-zinc-700 bg-zinc-100">
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

              {/* Upload button */}
              {photos.length < (formMode === 'apartment' ? 5 : 3) && (
                <div className={`relative w-16 h-16 border border-dashed rounded-2xl flex flex-col items-center justify-center bg-white dark:bg-[#313131] hover:bg-zinc-50 cursor-pointer text-[#9D9D9D] ${
                  errors.photos ? 'border-[#FF3662]' : 'border-gray-300 dark:border-zinc-700'
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
                className={`w-full bg-white dark:bg-[#313131] border rounded-2xl py-3.5 px-4 text-xs text-zinc-900 dark:text-white font-medium focus:outline-none placeholder:text-[#9D9D9D] leading-relaxed resize-none ${
                  errors.description ? 'border-[#FF3662]' : 'border-gray-200 dark:border-zinc-700'
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
                  value={formatPhoneDisplay(phone)}
                  onChange={handlePhoneChange}
                  className={`w-full bg-white dark:bg-[#313131] border rounded-2xl py-3.5 pl-9 pr-3 text-xs text-zinc-900 dark:text-white font-semibold focus:outline-none placeholder:text-[#9D9D9D] ${
                    errors.phone ? 'border-[#FF3662]' : 'border-gray-200 dark:border-zinc-700'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || userListingsCount >= 5}
                className="flex-[50] bg-[#007BFF] text-white rounded-2xl py-3.5 px-4 font-extrabold text-center flex items-center justify-center hover:bg-blue-600 active:scale-95 disabled:opacity-50 transition-all text-xs select-none shadow-sm uppercase tracking-wide"
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
