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

export default function EditListingPage({ params }: PageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const id = resolvedParams.id
  
  const { user } = useAppStore()

  // Form Fields State
  const [listing, setListing] = useState<Listing | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Fields
  const [city, setCity] = useState('Алматы')
  const [district, setDistrict] = useState('Не важно')
  const [gender, setGender] = useState('любой')
  const [ageFrom, setAgeFrom] = useState('')
  const [ageTo, setAgeTo] = useState('')
  const [rooms, setRooms] = useState('1')
  const [canLiveWith, setCanLiveWith] = useState('все') 
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
      setIsLoading(true)
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
        setGender(item.gender)
        setAgeFrom(item.age_from.toString())
        setAgeTo(item.age_to.toString())
        setRooms(item.rooms)
        setCanLiveWith(item.can_live_with || 'все')
        setPeopleCount(item.people_count.toString())
        setSearchingCount(item.searching_count.toString())
        setTerm(item.term)
        setTotalPeople(item.total_people.toString())
        setDeposit(item.deposit.toString())
        setContract(item.contract)
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
      } finally {
        setIsLoading(false)
      }
    }

    loadListing()
  }, [id, user, router])

  // Sync district when city updates, but preserve original if same
  useEffect(() => {
    if (listing && city === listing.city) {
      // Keep loaded district
      return
    }
    if (hasDistricts) {
      setDistrict(listing?.mode === 'apartment' ? 'Не важно' : currentCityData.districts[0])
    } else {
      setDistrict('-')
    }
    setErrors((prev) => ({ ...prev, district: false }))
  }, [city, hasDistricts])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-bg-light dark:bg-brand-bg-dark flex flex-col justify-start items-center">
        <div className="w-full max-w-md min-h-screen bg-brand-bg-light dark:bg-brand-bg-dark flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue mb-2"></div>
          <span className="text-xs text-brand-gray">Загрузка данных объявления...</span>
        </div>
      </div>
    )
  }

  if (!listing) return null

  const handleDropdownSelect = (dropdown: string, val: string) => {
    if (dropdown === 'city') setCity(val)
    if (dropdown === 'district') setDistrict(val)
    if (dropdown === 'gender') setGender(val)
    if (dropdown === 'rooms') setRooms(val)
    if (dropdown === 'canLiveWith') setCanLiveWith(val)
    if (dropdown === 'term') setTerm(val)
    if (dropdown === 'contract') setContract(val)

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
    setPhone(stripped.substring(0, 10))
    setErrors((prev) => ({ ...prev, phone: false }))
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const fileList = Array.from(e.target.files)
    const limit = listing.mode === 'apartment' ? 5 : 3
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
    setSubmitErrorMsg('')
    const newErrors: Record<string, boolean> = {}

    // Validation
    if (!priceFrom) newErrors.priceFrom = true
    if (!priceTo) newErrors.priceTo = true
    if (!ageFrom) newErrors.ageFrom = true
    if (!ageTo) newErrors.ageTo = true
    if (!phone || phone.length < 10) newErrors.phone = true
    if (!description || description.trim().length < 10) newErrors.description = true

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
      age_to: parseInt(ageTo),
      rooms,
      can_live_with: listing.mode === 'apartment' ? canLiveWith : null,
      people_count: parseInt(peopleCount),
      searching_count: parseInt(searchingCount),
      term,
      total_people: parseInt(totalPeople),
      deposit: parseInt(deposit.toString().replace(/\D/g, '')) || 0,
      contract,
      price_from: parseInt(priceFrom.toString().replace(/\D/g, '')),
      price_to: parseInt(priceTo.toString().replace(/\D/g, '')),
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
    } catch (err: any) {
      console.error('Error updating listing:', err)
      setSubmitErrorMsg(err.message || 'Ошибка сервера при изменении объявления.')
    } finally {
      setIsSubmitting(false)
    }
  }

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
              <div className="relative">
                <label className="block text-brand-gray text-[10px] uppercase mb-1">Город</label>
                <button
                  type="button"
                  onClick={() => toggleDropdown('city')}
                  className="w-full bg-white dark:bg-brand-card-dark border border-gray-200 dark:border-zinc-800 rounded-2xl py-3 px-4 text-left text-brand-black dark:text-brand-white font-bold flex justify-between items-center"
                >
                  <span>{city}</span>
                  <span className="text-[10px] text-brand-gray">▼</span>
                </button>
                {activeDropdown === 'city' && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-brand-card-dark border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl max-h-48 overflow-y-auto">
                    {CITIES_DATA.map((c) => (
                      <button
                        key={c.city}
                        type="button"
                        onClick={() => handleDropdownSelect('city', c.city)}
                        className="w-full text-left py-2.5 px-4 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-brand-black dark:text-brand-white"
                      >
                        {c.city}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <label className="block text-brand-gray text-[10px] uppercase mb-1">
                  {listing.mode === 'apartment' ? 'Ваш пол' : 'Ищу сожителя'}
                </label>
                <button
                  type="button"
                  onClick={() => toggleDropdown('gender')}
                  className="w-full bg-white dark:bg-brand-card-dark border border-gray-200 dark:border-zinc-800 rounded-2xl py-3 px-4 text-left text-brand-black dark:text-brand-white font-bold flex justify-between items-center"
                >
                  <span>{gender}</span>
                  <span className="text-[10px] text-brand-gray">▼</span>
                </button>
                {activeDropdown === 'gender' && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-brand-card-dark border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl">
                    {['любой', 'мужской', 'женский'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => handleDropdownSelect('gender', g)}
                        className="w-full text-left py-2.5 px-4 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-brand-black dark:text-brand-white"
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
                    ? 'bg-white dark:bg-brand-card-dark border-gray-200 dark:border-zinc-800 text-brand-black dark:text-brand-white'
                    : 'bg-zinc-150 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-800 text-brand-gray opacity-50 cursor-not-allowed'
                }`}
              >
                <span>{district}</span>
                <span className="text-[10px] text-brand-gray">▼</span>
              </button>
              {activeDropdown === 'district' && hasDistricts && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-brand-card-dark border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl max-h-48 overflow-y-auto">
                  {listing.mode === 'apartment' && (
                    <button
                      type="button"
                      onClick={() => handleDropdownSelect('district', 'Не важно')}
                      className="w-full text-left py-2.5 px-4 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-brand-black dark:text-brand-white"
                    >
                      Не важно
                    </button>
                  )}
                  {currentCityData?.districts.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleDropdownSelect('district', d)}
                      className="w-full text-left py-2.5 px-4 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-brand-black dark:text-brand-white"
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Row 3: Возраст & Комната */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col">
                <label className="block text-brand-gray text-[10px] uppercase mb-1">🎂 Возраст</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="number"
                    min="1"
                    placeholder="от"
                    value={ageFrom}
                    onChange={(e) => {
                      setAgeFrom(e.target.value.replace(/\D/g, ''))
                      setErrors((prev) => ({ ...prev, ageFrom: false }))
                    }}
                    className={`w-full bg-white dark:bg-brand-card-dark border rounded-2xl py-3 px-3 text-center text-brand-black dark:text-brand-white font-bold focus:outline-none ${
                      errors.ageFrom ? 'border-brand-red' : 'border-gray-200 dark:border-zinc-800'
                    }`}
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="до"
                    value={ageTo}
                    onChange={(e) => {
                      setAgeTo(e.target.value.replace(/\D/g, ''))
                      setErrors((prev) => ({ ...prev, ageTo: false }))
                    }}
                    className={`w-full bg-white dark:bg-brand-card-dark border rounded-2xl py-3 px-3 text-center text-brand-black dark:text-brand-white font-bold focus:outline-none ${
                      errors.ageTo ? 'border-brand-red' : 'border-gray-200 dark:border-zinc-800'
                    }`}
                  />
                </div>
              </div>

              <div className="relative">
                <label className="block text-brand-gray text-[10px] uppercase mb-1">Комнатность</label>
                <button
                  type="button"
                  onClick={() => toggleDropdown('rooms')}
                  className="w-full bg-white dark:bg-brand-card-dark border border-gray-200 dark:border-zinc-800 rounded-2xl py-3 px-4 text-left text-brand-black dark:text-brand-white font-bold flex justify-between items-center"
                >
                  <span>{rooms} комната</span>
                  <span className="text-[10px] text-brand-gray">▼</span>
                </button>
                {activeDropdown === 'rooms' && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-brand-card-dark border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl">
                    {['1', '2', '3', '4+'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleDropdownSelect('rooms', r)}
                        className="w-full text-left py-2.5 px-4 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-brand-black dark:text-brand-white"
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
              {listing.mode === 'apartment' ? (
                <>
                  <div className="relative">
                    <label className="block text-brand-gray text-[10px] uppercase mb-1">С кем могу жить</label>
                    <button
                      type="button"
                      onClick={() => toggleDropdown('canLiveWith')}
                      className="w-full bg-white dark:bg-brand-card-dark border border-gray-200 dark:border-zinc-800 rounded-2xl py-3 px-4 text-left text-brand-black dark:text-brand-white font-bold flex justify-between items-center"
                    >
                      <span>{canLiveWith}</span>
                      <span className="text-[10px] text-brand-gray">▼</span>
                    </button>
                    {activeDropdown === 'canLiveWith' && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-brand-card-dark border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl">
                        {['все', 'парни', 'девушки', 'семейная пара'].map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => handleDropdownSelect('canLiveWith', item)}
                            className="w-full text-left py-2.5 px-4 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-brand-black dark:text-brand-white"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <label className="block text-brand-gray text-[10px] uppercase mb-1">Нас: человек</label>
                    <input
                      type="number"
                      min="1"
                      value={peopleCount}
                      onChange={(e) => setPeopleCount(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-white dark:bg-brand-card-dark border border-gray-200 dark:border-zinc-800 rounded-2xl py-3 px-4 text-brand-black dark:text-brand-white font-bold focus:outline-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col">
                    <label className="block text-brand-gray text-[10px] uppercase mb-1">Будет жить: чел.</label>
                    <input
                      type="number"
                      min="1"
                      value={peopleCount}
                      onChange={(e) => setPeopleCount(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-white dark:bg-brand-card-dark border border-gray-200 dark:border-zinc-800 rounded-2xl py-3 px-4 text-brand-black dark:text-brand-white font-bold focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="block text-brand-gray text-[10px] uppercase mb-1">Ищу: сожителей</label>
                    <input
                      type="number"
                      min="1"
                      value={searchingCount}
                      onChange={(e) => setSearchingCount(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-white dark:bg-brand-card-dark border border-gray-200 dark:border-zinc-800 rounded-2xl py-3 px-4 text-brand-black dark:text-brand-white font-bold focus:outline-none"
                    />
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
                      className="w-full bg-white dark:bg-brand-card-dark border border-gray-200 dark:border-zinc-800 rounded-2xl py-3 px-4 text-left text-brand-black dark:text-brand-white font-bold flex justify-between items-center"
                    >
                      <span>{term}</span>
                      <span className="text-[10px] text-brand-gray">▼</span>
                    </button>
                    {activeDropdown === 'term' && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-brand-card-dark border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl">
                        {['длительно', 'посуточно', 'на пару месяцев'].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => handleDropdownSelect('term', t)}
                            className="w-full text-left py-2.5 px-4 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-brand-black dark:text-brand-white"
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <label className="block text-brand-gray text-[10px] uppercase mb-1">Общий: человек</label>
                    <input
                      type="number"
                      min="1"
                      value={totalPeople}
                      onChange={(e) => setTotalPeople(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-white dark:bg-brand-card-dark border border-gray-200 dark:border-zinc-800 rounded-2xl py-3 px-4 text-brand-black dark:text-brand-white font-bold focus:outline-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col">
                    <label className="block text-brand-gray text-[10px] uppercase mb-1">Общий: человек</label>
                    <input
                      type="number"
                      min="1"
                      value={totalPeople}
                      onChange={(e) => setTotalPeople(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-white dark:bg-brand-card-dark border border-gray-200 dark:border-zinc-800 rounded-2xl py-3 px-4 text-brand-black dark:text-brand-white font-bold focus:outline-none"
                    />
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
              <div className="flex flex-col">
                <label className="block text-brand-gray text-[10px] uppercase mb-1">Депозит (₸)</label>
                <input
                  type="text"
                  placeholder="0"
                  value={formatBudgetDisplay(deposit)}
                  onChange={(e) => setDeposit(e.target.value)}
                  className="w-full bg-white dark:bg-brand-card-dark border border-gray-200 dark:border-zinc-800 rounded-2xl py-3 px-4 text-brand-black dark:text-brand-white font-bold focus:outline-none"
                />
              </div>

              <div className="relative">
                <label className="block text-brand-gray text-[10px] uppercase mb-1">Официальный договор</label>
                <button
                  type="button"
                  onClick={() => toggleDropdown('contract')}
                  className="w-full bg-white dark:bg-brand-card-dark border border-gray-200 dark:border-zinc-800 rounded-2xl py-3 px-4 text-left text-brand-black dark:text-brand-white font-bold flex justify-between items-center"
                >
                  <span>{contract === 'yes' ? 'да' : 'нет'}</span>
                  <span className="text-[10px] text-brand-gray">▼</span>
                </button>
                {activeDropdown === 'contract' && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-brand-card-dark border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl">
                    <button
                      type="button"
                      onClick={() => handleDropdownSelect('contract', 'yes')}
                      className="w-full text-left py-2.5 px-4 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-brand-black dark:text-brand-white"
                    >
                      да
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDropdownSelect('contract', 'no')}
                      className="w-full text-left py-2.5 px-4 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-brand-black dark:text-brand-white"
                    >
                      нет
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Row 7: Бюджет */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col">
                <label className="block text-brand-gray text-[10px] uppercase mb-1">Бюджет От (₸)</label>
                <input
                  type="text"
                  value={formatBudgetDisplay(priceFrom)}
                  onChange={(e) => {
                    setPriceFrom(e.target.value)
                    setErrors((prev) => ({ ...prev, priceFrom: false }))
                  }}
                  className={`w-full bg-white dark:bg-brand-card-dark border rounded-2xl py-3 px-4 text-brand-black dark:text-brand-white font-bold focus:outline-none ${
                    errors.priceFrom ? 'border-brand-red' : 'border-gray-200 dark:border-zinc-800'
                  }`}
                />
              </div>

              <div className="flex flex-col">
                <label className="block text-brand-gray text-[10px] uppercase mb-1">Бюджет До (₸)</label>
                <input
                  type="text"
                  value={formatBudgetDisplay(priceTo)}
                  onChange={(e) => {
                    setPriceTo(e.target.value)
                    setErrors((prev) => ({ ...prev, priceTo: false }))
                  }}
                  className={`w-full bg-white dark:bg-brand-card-dark border rounded-2xl py-3 px-4 text-brand-black dark:text-brand-white font-bold focus:outline-none ${
                    errors.priceTo ? 'border-brand-red' : 'border-gray-200 dark:border-zinc-800'
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

                {photos.length < (listing.mode === 'apartment' ? 5 : 3) && (
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
                className="w-[50%] bg-brand-blue text-white rounded-2xl py-3.5 px-4 font-extrabold text-center flex items-center justify-center hover:bg-blue-600 active:scale-95 transition-all text-xs select-none shadow-xs"
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
