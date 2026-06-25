'use client'

import React, { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore, Listing } from '@/store/useAppStore'
import { Header } from '@/components/header'
import { CITIES_DATA } from '@/lib/constants'
import { useRouter } from 'next/navigation'
import { Camera, ShieldAlert } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

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

export default function EditListingPage({ params }: PageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const id = resolvedParams.id
  
  const { user } = useAppStore()

  // Form Fields State
  const [listing, setListing] = useState<Listing | null>(null)
  
  // Fields
  const [city, setCity] = useState('Алматы')
  const [district, setDistrict] = useState('Не важно')
  const [gender, setGender] = useState('любой')
  const [ageFrom, setAgeFrom] = useState('')
  const [ageTo, setAgeTo] = useState('')
  const [rooms, setRooms] = useState('1')
  const [canLiveWith, setCanLiveWith] = useState('Не важно') 
  const [peopleCount, setPeopleCount] = useState('1')
  const [searchingCount, setSearchingCount] = useState('1')
  const [term, setTerm] = useState('длительно')
  const [totalPeople, setTotalPeople] = useState('2')
  const [deposit, setDeposit] = useState('0')
  const [contract, setContract] = useState('yes')
  const [priceFrom, setPriceFrom] = useState('')
  const [priceTo, setPriceTo] = useState('')
  const [description, setDescription] = useState('')
  const [phone, setPhone] = useState('')
  const [addressLink, setAddressLink] = useState('')
  const [photos, setPhotos] = useState<string[]>([])

  // UI state
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [submitErrorMsg, setSubmitErrorMsg] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Sync district based on city
  const currentCityData = CITIES_DATA.find((c) => c.city === city)
  const hasDistricts = currentCityData && currentCityData.districts.length > 0

  // First, load existing listing data
  useEffect(() => {
    if (!user) {
      router.push('/profile')
      return
    }

    const loadListing = async () => {
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        const item = data as Listing

        // Check ownership
        if (item.owner_id !== user.id) {
          router.push('/profile')
          return
        }

        // Prefill form
        setListing(item)
        setCity(item.city)
        setDistrict(item.district || (item.mode === 'apartment' ? 'Не важно' : '-'))
        
        // Gender mapping (literal: "Парень", "Девушка")
        const mappedGender = item.gender === 'мужской' || item.gender === 'Только парни'
          ? 'Парень'
          : (item.gender === 'женский' || item.gender === 'Только девочки' ? 'Девушка' : item.gender)
        setGender(mappedGender)

        // Age mapping: single age for apartment mode, range for roommate mode
        if (item.mode === 'apartment') {
          setAgeFrom(`${item.age_from} лет`)
          setAgeTo(`${item.age_from} лет`)
        } else {
          setAgeFrom(item.age_from.toString())
          setAgeTo(item.age_to.toString())
        }

        // Rooms mapping (ensure literal suffix)
        const mappedRooms = item.rooms.includes('-комн')
          ? item.rooms
          : `${item.rooms}-комнатный`
        setRooms(mappedRooms)

        setCanLiveWith(item.can_live_with || 'Не важно')
        setPeopleCount(item.mode === 'roommate' ? (item.can_live_with || 'Не важно') : item.people_count.toString())
        setSearchingCount(item.searching_count.toString())
        setTerm(item.term)
        setTotalPeople(item.total_people.toString())
        setDeposit(item.deposit > 0 ? 'Есть' : 'Нет')
        setContract(item.contract === 'yes' ? 'Есть' : 'Нет')
        setPriceFrom(item.price_from.toString())
        setPriceTo(item.price_to.toString())
        setDescription(item.description)
        setPhotos(item.photos || [])
        setAddressLink(item.address_link || '')
        
        // Strip country code from phone (+7...)
        const rawPhone = item.phone.replace(/^\+7/, '')
        setPhone(rawPhone)

      } catch (err) {
        console.error('Error loading listing to edit:', err)
        router.push('/profile')
      }
    }

    loadListing()
  }, [id, user, router])

  const handleDropdownSelect = (dropdown: string, val: string) => {
    if (dropdown === 'city') {
      setCity(val)
      const newCityData = CITIES_DATA.find((c) => c.city === val)
      const newHasDistricts = newCityData && newCityData.districts.length > 0
      if (newHasDistricts) {
        setDistrict(listing?.mode === 'apartment' ? 'Не важно' : newCityData.districts[0])
      } else {
        setDistrict('-')
      }
      setErrors((prev) => ({ ...prev, district: false }))
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
    setPhone(stripped.substring(0, 10))
    setErrors((prev) => ({ ...prev, phone: false }))
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrors((prev) => ({ ...prev, photos: false }))
    if (!e.target.files) return
    const fileList = Array.from(e.target.files)
    const limit = listing?.mode === 'apartment' ? 5 : 3
    const availableSlots = limit - photos.length

    if (availableSlots <= 0) {
      alert(`Максимум фотографий для этого режима: ${limit}`)
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
    if (!listing) return
    setSubmitErrorMsg('')
    const newErrors: Record<string, boolean> = {}

    // Validation
    if (!city) newErrors.city = true

    // District Validation (mandatory if city has districts)
    if (hasDistricts) {
      if (listing.mode === 'roommate') {
        if (!district || district === 'Не важно' || district === '-') {
          newErrors.district = true
        }
      } else {
        if (!district || district === '-') {
          newErrors.district = true
        }
      }
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
    if (listing.mode === 'roommate') {
      if (!ageTo) newErrors.ageTo = true
      if (ageFrom && ageTo && parseInt(ageFrom) > parseInt(ageTo)) {
        newErrors.ageFrom = true
        newErrors.ageTo = true
        setSubmitErrorMsg('Минимальный возраст (от) не может быть больше максимального (до).')
      }
    }

    if (!rooms) newErrors.rooms = true
    if (!term) newErrors.term = true
    if (listing.mode === 'roommate') {
      if (!gender) newErrors.gender = true
      if (!peopleCount) newErrors.peopleCount = true
      if (!searchingCount) newErrors.searchingCount = true
      if (!totalPeople) newErrors.totalPeople = true
    }


    if (!phone || phone.length < 10) newErrors.phone = true


    if (listing.mode === 'roommate') {
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

    // Photo limits validation: apartment (3-5), roommate (1-3)
    const minPhotos = listing.mode === 'apartment' ? 3 : 1
    const maxPhotos = listing.mode === 'apartment' ? 5 : 3

    if (photos.length < minPhotos) {
      newErrors.photos = true
      setSubmitErrorMsg(
        listing.mode === 'apartment'
          ? 'Для категории «Ищу квартиру» необходимо загрузить от 3 до 5 фотографий.'
          : 'Для категории «Ищу соседа» необходимо загрузить хотя бы 1 фотографию (селфи).'
      )
    } else if (photos.length > maxPhotos) {
      newErrors.photos = true
      setSubmitErrorMsg(`Максимум можно добавить ${maxPhotos} фотографии.`)
    }

    if (Object.keys(newErrors).length > 0 || submitErrorMsg) {
      setErrors(newErrors)
      if (!submitErrorMsg) setSubmitErrorMsg('Пожалуйста, заполните выделенные поля корректно.')
      return
    }

    setIsSubmitting(true)

    // Build update payload
    const payload = {
      city,
      district: hasDistricts && district !== 'Не важно' && district !== '-' ? district : null,
      gender,
      age_from: parseInt(ageFrom),
      age_to: listing.mode === 'apartment' ? parseInt(ageFrom) : parseInt(ageTo),
      rooms,
      can_live_with: listing.mode === 'apartment' ? (canLiveWith || 'Не важно') : peopleCount,
      people_count: listing.mode === 'roommate'
        ? Math.max(1, (parseInt(totalPeople) || 1) - (parseInt(searchingCount) || 1))
        : (parseInt(peopleCount) || 1),
      searching_count: listing.mode === 'roommate' ? (parseInt(searchingCount) || 1) : (parseInt(peopleCount) || 1),
      term,
      total_people: (parseInt(totalPeople) || 1),
      deposit: deposit === 'Есть' ? 1 : 0,
      contract: contract === 'Есть' ? 'yes' : 'no',
      price_from: parseInt(priceFrom),
      price_to: parseInt(priceTo),
      photos,
      description,
      phone: `+7${phone}`,
      address_link: listing.mode === 'roommate' ? addressLink : null,
      updated_at: new Date().toISOString(),
    }

    try {
      const { error } = await supabase
        .from('listings')
        .update(payload)
        .eq('id', listing.id)

      if (error) throw error

      router.push('/profile')
    } catch (err) {
      console.error('Error updating listing detailed:', err)
      let errorMsg = 'Ошибка сервера при изменении объявления.'
      if (err && typeof err === 'object') {
        const anyErr = err as any
        errorMsg = anyErr.message || anyErr.details || anyErr.hint || JSON.stringify(anyErr)
      } else if (err instanceof Error) {
        errorMsg = err.message
      }
      setSubmitErrorMsg(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format phone output for visual convenience as 777 777 7777
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

  const dropdownToggleClass = (err: boolean) =>
    `w-full bg-white dark:bg-brand-card-dark border rounded-2xl py-3 px-4 text-left text-brand-black dark:text-brand-white font-bold flex justify-between items-center ${
      err ? 'border-brand-red' : 'border-gray-200 dark:border-zinc-800'
    }`

  const dropdownListClass = "absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-brand-card-dark border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl max-h-80 overflow-y-auto"
  const dropdownItemClass = "w-full text-left py-2.5 px-4 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-brand-black dark:text-brand-white"

  if (!listing) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] dark:bg-[#202020] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007BFF]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-zinc-100 dark:bg-zinc-950 flex flex-col justify-start items-center">
      <div className="w-full max-w-md min-h-screen bg-brand-bg-light dark:bg-brand-bg-dark flex flex-col pb-12 relative shadow-md border-x border-gray-200 dark:border-zinc-800 transition-colors duration-200 select-none">
        
        {/* Header */}
        <Header type="title" title="редактировать" showBack={true} showHelpToggle={false} />

        <div className="flex-1 px-5 py-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs font-semibold">
            
            {submitErrorMsg && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-brand-red rounded-2xl p-4 flex gap-3 leading-relaxed">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <span>{submitErrorMsg}</span>
              </div>
            )}

            {/* Row 1: Город & Пол */}
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
                  {listing.mode === 'apartment' ? 'Ваш пол' : 'Пол автора'}
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

            {/* Row 2: Район */}
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
                  {listing.mode === 'apartment' && (
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
              {listing.mode === 'apartment' ? (
                /* Apartment Single Age Dropdown */
                <div className="flex flex-col">
                  <label className="block text-brand-gray text-[10px] uppercase mb-1">🎂 Возраст</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => toggleDropdown('ageFrom')}
                      className={dropdownToggleClass(errors.ageFrom)}
                    >
                      <span>{ageFrom || 'Возраст'}</span>
                      <span className="text-[10px] text-brand-gray">▼</span>
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
                              setActiveDropdown(null)
                              setErrors((prev) => ({ ...prev, ageFrom: false, ageTo: false }))
                            }}
                            className={dropdownItemClass}
                          >
                            {a}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Roommate Age Range inline capsule */
                <div className="flex flex-col">
                  <label className="block text-brand-gray text-[10px] uppercase mb-1">🎂 Возраст</label>
                  <div className="flex items-center bg-white dark:bg-brand-card-dark border border-gray-200 dark:border-zinc-800 rounded-2xl min-h-[44px] text-xs relative select-none">
                    {/* Age From */}
                    <div className="relative flex-1 h-full">
                      <button
                        type="button"
                        onClick={() => toggleDropdown('ageFrom')}
                        className="w-full h-full py-3 px-2 text-center flex justify-between items-center text-xs font-bold text-brand-black dark:text-brand-white cursor-pointer"
                      >
                        <span className="w-full text-center">{ageFrom || 'от'}</span>
                        <span className="text-[9px] text-[#9D9D9D] shrink-0">▼</span>
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
                              className="w-full text-center py-2 px-3 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-brand-black dark:text-brand-white cursor-pointer"
                            >
                              {a}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="h-5 w-[1px] bg-zinc-200 dark:bg-zinc-850"></div>
                    {/* Age To */}
                    <div className="relative flex-1 h-full">
                      <button
                        type="button"
                        onClick={() => toggleDropdown('ageTo')}
                        className="w-full h-full py-3 px-2 text-center flex justify-between items-center text-xs font-bold text-brand-black dark:text-brand-white cursor-pointer"
                      >
                        <span className="w-full text-center">{ageTo || 'до'}</span>
                        <span className="text-[9px] text-[#9D9D9D] shrink-0">▼</span>
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
                              className="w-full text-center py-2 px-3 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-brand-black dark:text-brand-white cursor-pointer"
                            >
                              {a}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Rooms select */}
              <div className="relative flex flex-col">
                <label className="block text-brand-gray text-[10px] uppercase mb-1">Комнатность</label>
                <button
                  type="button"
                  onClick={() => toggleDropdown('rooms')}
                  className={dropdownToggleClass(errors.rooms)}
                >
                  <span>
                    {rooms || 'Комната'}
                  </span>
                  <span className="text-[10px] text-brand-gray">▼</span>
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

            {/* Row 4: С кем могу жить / Будет жить & Нас / Ищу */}
            <div className="grid grid-cols-2 gap-3">
              {listing.mode === 'apartment' ? (
                /* Apartment mode */
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
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'].map((c) => (
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
                /* Roommate mode Row 4: Будет жить & Ищу: */
                <>
                  <div className="relative">
                    <label className="block text-brand-gray text-[10px] uppercase mb-1">Будет жить</label>
                    <button
                      type="button"
                      onClick={() => toggleDropdown('peopleCount')}
                      className={dropdownToggleClass(!!errors.peopleCount)}
                    >
                      <span>{peopleCount || 'Будет жить'}</span>
                      <span className="text-[10px] text-brand-gray">▼</span>
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

                  <div className="relative">
                    <label className="block text-brand-gray text-[10px] uppercase mb-1">Ищу:</label>
                    <button
                      type="button"
                      onClick={() => toggleDropdown('searchingCount')}
                      className={dropdownToggleClass(!!errors.searchingCount)}
                    >
                      <span>{searchingCount ? `Ищу: ${searchingCount}` : 'Ищу:'}</span>
                      <span className="text-[10px] text-brand-gray">▼</span>
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

            {/* Row 5: Срок & Общий OR Общий & Адрес ссылка */}
            <div className="grid grid-cols-2 gap-3">
              {listing.mode === 'apartment' ? (
                <>
                  <div className="relative">
                    <label className="block text-brand-gray text-[10px] uppercase mb-1">Срок</label>
                    <button
                      type="button"
                      onClick={() => toggleDropdown('term')}
                      className={dropdownToggleClass(errors.term)}
                    >
                      <span>{term}</span>
                      <span className="text-[10px] text-brand-gray">▼</span>
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
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'].map((c) => (
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
                /* Roommate mode Row 5: Общий & Адрес ссылка */
                <>
                  <div className="relative">
                    <label className="block text-brand-gray text-[10px] uppercase mb-1">Общий: человек</label>
                    <button
                      type="button"
                      onClick={() => toggleDropdown('totalPeople')}
                      className={dropdownToggleClass(errors.totalPeople)}
                    >
                      <span>{totalPeople || 'Общий:'}</span>
                      <span className="text-[10px] text-brand-gray">▼</span>
                    </button>
                    {activeDropdown === 'totalPeople' && (
                      <div className={dropdownListClass}>
                        {Array.from({ length: 9 }, (_, i) => `Общий: ${i + 1}`).concat('Общий: 10+').map((c) => (
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

                  {/* Адрес ссылка (2GIS) */}
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
                      className={`w-full bg-white dark:bg-brand-card-dark border rounded-2xl py-3 px-4 text-brand-black dark:text-brand-white font-bold focus:outline-none min-h-[44px] ${
                        errors.addressLink ? 'border-brand-red' : 'border-gray-200 dark:border-zinc-800'
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
                <label className="block text-brand-gray text-[10px] uppercase mb-1">Депозит</label>
                <button
                  type="button"
                  onClick={() => toggleDropdown('deposit')}
                  className={dropdownToggleClass(false)}
                >
                  <span>
                    {listing.mode === 'roommate' ? `Депозит: ${deposit}` : (deposit === 'Есть' ? 'Депозит есть' : 'Без депозита')}
                  </span>
                  <span className="text-[10px] text-brand-gray">▼</span>
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
                        {d === 'Есть' ? 'Депозит есть' : 'Без депозита'}
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
                  <span>
                    {listing.mode === 'roommate' ? `Договор: ${contract}` : (contract === 'Есть' ? 'Договор есть' : 'Без договора')}
                  </span>
                  <span className="text-[10px] text-brand-gray">▼</span>
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
                        {c === 'Есть' ? 'Договор есть' : 'Без договора'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Срок проживания (roommate only) */}
            {listing.mode === 'roommate' && (
              <div className="relative">
                <label className="block text-brand-gray text-[10px] uppercase mb-1">Срок проживания</label>
                <button
                  type="button"
                  onClick={() => toggleDropdown('term')}
                  className={dropdownToggleClass(errors.term)}
                >
                  <span>{term ? `Срок: ${term}` : 'Срок проживания'}</span>
                  <span className="text-[10px] text-brand-gray">▼</span>
                </button>
                {activeDropdown === 'term' && (
                  <div className={dropdownListClass}>
                    {Array.from({ length: 12 }, (_, i) => `${i + 1} month`).map((_, i) => `${i + 1} месяц`).map((t) => (
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
            )}

            {/* Row 7: Бюджет */}
            <div className="grid grid-cols-2 gap-3">
              {/* Budget From */}
              <div className="relative">
                <label className="block text-brand-gray text-[10px] uppercase mb-1">Бюджет От (₸)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="от"
                  value={formatBudgetDisplay(priceFrom)}
                  onKeyDown={handleNumberKeyDown}
                  onChange={(e) => {
                    setPriceFrom(e.target.value.replace(/\D/g, ''))
                    setErrors((prev) => ({ ...prev, priceFrom: false }))
                  }}
                  className={`w-full bg-white dark:bg-[#313131] border rounded-2xl py-3.5 px-4 text-brand-black dark:text-brand-white font-bold focus:outline-none placeholder:text-[#9D9D9D] transition-all duration-150 ${
                    errors.priceFrom ? 'border-[#FF3662]' : 'border-gray-200 dark:border-zinc-800'
                  }`}
                />
              </div>

              {/* Budget To */}
              <div className="relative">
                <label className="block text-brand-gray text-[10px] uppercase mb-1">Бюджет До (₸)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="до"
                  value={formatBudgetDisplay(priceTo)}
                  onKeyDown={handleNumberKeyDown}
                  onChange={(e) => {
                    setPriceTo(e.target.value.replace(/\D/g, ''))
                    setErrors((prev) => ({ ...prev, priceTo: false }))
                  }}
                  className={`w-full bg-white dark:bg-[#313131] border rounded-2xl py-3.5 px-4 text-brand-black dark:text-brand-white font-bold focus:outline-none placeholder:text-[#9D9D9D] transition-all duration-150 ${
                    errors.priceTo ? 'border-[#FF3662]' : 'border-gray-200 dark:border-zinc-800'
                  }`}
                />
              </div>
            </div>

            {/* Row 8: + фото */}
            <div className="flex flex-col gap-2.5">
              <label className="block text-brand-gray text-[10px] uppercase">
                Фотографии (загружено {photos.length} из {listing.mode === 'apartment' ? 5 : 3})
              </label>

              <div className="flex flex-wrap gap-2 items-center">
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

                {/* Upload button */}
                {photos.length < (listing.mode === 'apartment' ? 5 : 3) && (
                  <div className={`relative w-16 h-16 border border-dashed rounded-xl flex items-center justify-center bg-white dark:bg-brand-card-dark hover:bg-zinc-50 cursor-pointer ${
                    errors.photos ? 'border-[#FF3662]' : 'border-gray-300 dark:border-zinc-800'
                  }`}>
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

            {/* Row 9: Описание */}
            <div className="flex flex-col">
              <label className="block text-brand-gray text-[10px] uppercase mb-1">Описание объявления</label>
              <textarea
                rows={4}
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

            {/* Bottom Row */}
            <div className="flex justify-between items-end gap-3 mt-4 pt-2 border-t border-gray-150 dark:border-zinc-850">
              
              <div className="w-[45%] flex flex-col">
                <label className="block text-brand-gray text-[10px] uppercase mb-1">Телефон</label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 font-bold text-brand-black dark:text-brand-white text-sm">+7</span>
                  <input
                    type="text"
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
                disabled={isSubmitting}
                className="w-[50%] bg-[#007BFF] text-white rounded-2xl py-3.5 px-4 font-extrabold text-center flex items-center justify-center hover:bg-blue-600 active:scale-95 transition-all text-xs select-none shadow-xs"
              >
                {isSubmitting ? 'Сохранение...' : 'готово'}
              </button>

            </div>

          </form>
        </div>

      </div>
    </div>
  )
}
