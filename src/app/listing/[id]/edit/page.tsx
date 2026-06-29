'use client'

import React, { useState, useEffect, use } from 'react'
import { supabase, uploadListingPhoto, deleteListingPhoto } from '@/lib/supabase'
import { useAppStore, Listing } from '@/store/useAppStore'
import { Header } from '@/components/header'
import { CITIES_DATA } from '@/lib/constants'
import { useRouter } from 'next/navigation'
import { Mi } from '@/components/icons'

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
  const [photos, setPhotos] = useState<string[]>([]) // Storage URLs or legacy Base64
  const [uploadingPreviews, setUploadingPreviews] = useState<string[]>([]) // Temp object URLs while uploading
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false)

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

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrors((prev) => ({ ...prev, photos: false }))
    if (!e.target.files || !user) return
    const fileList = Array.from(e.target.files)
    const limit = listing?.mode === 'apartment' ? 3 : 5
    const totalSlots = photos.length + uploadingPreviews.length
    const availableSlots = limit - totalSlots

    if (availableSlots <= 0) {
      alert(`Максимум фотографий для этого режима: ${limit}`)
      return
    }

    const filesToUpload = fileList.slice(0, availableSlots)
    const previews = filesToUpload.map((f) => URL.createObjectURL(f))
    setUploadingPreviews((prev) => [...prev, ...previews])
    setIsUploadingPhotos(true)

    const results = await Promise.all(
      filesToUpload.map(async (file, idx) => {
        const url = await uploadListingPhoto(file, user.id)
        return { preview: previews[idx], url }
      })
    )

    const successPreviews = results.filter((r) => r.url).map((r) => r.preview)
    const successUrls = results.filter((r) => r.url).map((r) => r.url as string)
    setUploadingPreviews((prev) => prev.filter((p) => !successPreviews.includes(p)))
    setPhotos((prev) => [...prev, ...successUrls])
    setIsUploadingPhotos(false)
    previews.forEach((p) => URL.revokeObjectURL(p))
  }

  const handleRemovePhoto = async (idx: number) => {
    const url = photos[idx]
    setPhotos((prev) => prev.filter((_, i) => i !== idx))
    if (url && !url.startsWith('data:')) {
      await deleteListingPhoto(url)
    }
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
        const is2gisLink = /^https?:\/\/(?:[^/]*\.)?2gis\.(?:kz|ru|com)\//i.test(addressLink)
        if (!is2gisLink) {
          newErrors.addressLink = true
          setSubmitErrorMsg('Неверный формат ссылки 2GIS. Ссылка должна начинаться с https://2gis.kz, https://2gis.ru или https://go.2gis.com')
        }
      }
    }

    // Photo limits: apartment = min 0, max 3; roommate = min 3, max 5
    if (listing.mode === 'apartment') {
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
      setSubmitErrorMsg('Ошибка сервера при изменении объявления. Попробуйте ещё раз.')
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
    `w-full bg-[var(--surface-container-lowest)] border rounded-[12px] py-3 px-4 text-left text-[var(--on-surface)] font-semibold flex justify-between items-center text-sm ${
      err ? 'border-[var(--brand-red)]' : 'border-[var(--outline-border)]'
    }`

  const dropdownListClass = "absolute top-full left-0 right-0 z-50 mt-1 bg-[var(--surface-container-lowest)] border border-[var(--outline-border)] rounded-[16px] shadow-xl max-h-80 overflow-y-auto"
  const dropdownItemClass = "w-full text-left py-2.5 px-4 text-sm font-medium text-[var(--on-surface)] hover:bg-[var(--surface-container-low)]"

  if (!listing) {
    return (
      <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--brand-blue-container)' }} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', width: '100%', background: 'var(--surface-container-highest)', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 390, minHeight: '100%', background: 'var(--surface)', borderLeft: '1px solid var(--outline-border)', borderRight: '1px solid var(--outline-border)', boxShadow: '0 0 40px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', paddingBottom: 48, userSelect: 'none' }}>

        <Header type="title" title="редактировать" showBack={true} showHelpToggle={false} />

        <div style={{ flex: 1, padding: '16px 20px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13, fontWeight: 500 }}>
            
            {submitErrorMsg && (
              <div style={{ background: 'var(--brand-red-soft)', border: '1px solid var(--brand-red-border)', color: 'var(--brand-red)', borderRadius: 16, padding: '12px 16px', display: 'flex', gap: 10, lineHeight: 1.5 }}>
                <Mi name="warning" size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{submitErrorMsg}</span>
              </div>
            )}

            {/* Row 1: Город & Пол */}
            <div className="grid grid-cols-2 gap-3">
              {/* City */}
              <div className="relative">
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--outline)', marginBottom: 4 }}>Город</label>
                <button
                  type="button"
                  onClick={() => toggleDropdown('city')}
                  className={dropdownToggleClass(errors.city)}
                >
                  <span>{city}</span>
                  <Mi name="expand_more" size={16} color="var(--outline)" />
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
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--outline)', marginBottom: 4 }}>
                  {listing.mode === 'apartment' ? 'Ваш пол' : 'Пол автора'}
                </label>
                <button
                  type="button"
                  onClick={() => toggleDropdown('gender')}
                  className={dropdownToggleClass(errors.gender)}
                >
                  <span>{gender}</span>
                  <Mi name="expand_more" size={16} color="var(--outline)" />
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
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--outline)', marginBottom: 4 }}>Район</label>
              <button
                type="button"
                disabled={!hasDistricts}
                onClick={() => toggleDropdown('district')}
                className={dropdownToggleClass(!!errors.district)}
                style={!hasDistricts ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
              >
                <span>{district}</span>
                <Mi name="expand_more" size={16} color="var(--outline)" />
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
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--outline)', marginBottom: 4 }}>Возраст</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => toggleDropdown('ageFrom')}
                      className={dropdownToggleClass(errors.ageFrom)}
                    >
                      <span>{ageFrom || 'Возраст'}</span>
                      <Mi name="expand_more" size={16} color="var(--outline)" />
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
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--outline)', marginBottom: 4 }}>Возраст</label>
                  <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-container-lowest)', border: `1px solid ${(errors.ageFrom || errors.ageTo) ? 'var(--brand-red)' : 'var(--outline-border)'}`, borderRadius: 12, minHeight: 44, fontSize: 12, position: 'relative', userSelect: 'none', overflow: 'hidden' }}>
                    {/* Age From */}
                    <div className="relative flex-1 h-full">
                      <button
                        type="button"
                        onClick={() => toggleDropdown('ageFrom')}
                        style={{ width: '100%', height: '100%', padding: '12px 8px', textAlign: 'center', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, fontWeight: 700, color: 'var(--on-surface)', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit' }}
                      >
                        <span style={{ width: '100%', textAlign: 'center' }}>{ageFrom || 'от'}</span>
                        <Mi name="expand_more" size={14} color="var(--outline)" />
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
                              className={dropdownItemClass}
                              style={{ textAlign: 'center' }}
                            >
                              {a}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ height: 20, width: 1, background: 'var(--outline-border)', flexShrink: 0 }}></div>
                    {/* Age To */}
                    <div className="relative flex-1 h-full">
                      <button
                        type="button"
                        onClick={() => toggleDropdown('ageTo')}
                        style={{ width: '100%', height: '100%', padding: '12px 8px', textAlign: 'center', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, fontWeight: 700, color: 'var(--on-surface)', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit' }}
                      >
                        <span style={{ width: '100%', textAlign: 'center' }}>{ageTo || 'до'}</span>
                        <Mi name="expand_more" size={14} color="var(--outline)" />
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
                              className={dropdownItemClass}
                              style={{ textAlign: 'center' }}
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
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--outline)', marginBottom: 4 }}>Комнатность</label>
                <button
                  type="button"
                  onClick={() => toggleDropdown('rooms')}
                  className={dropdownToggleClass(errors.rooms)}
                >
                  <span>
                    {rooms || 'Комната'}
                  </span>
                  <Mi name="expand_more" size={16} color="var(--outline)" />
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
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--outline)', marginBottom: 4 }}>С кем могу жить</label>
                    <button
                      type="button"
                      onClick={() => toggleDropdown('canLiveWith')}
                      className={dropdownToggleClass(false)}
                    >
                      <span>{canLiveWith}</span>
                      <Mi name="expand_more" size={16} color="var(--outline)" />
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
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--outline)', marginBottom: 4 }}>Нас: человек</label>
                    <button
                      type="button"
                      onClick={() => toggleDropdown('peopleCount')}
                      className={dropdownToggleClass(false)}
                    >
                      <span>{peopleCount} чел.</span>
                      <Mi name="expand_more" size={16} color="var(--outline)" />
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
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--outline)', marginBottom: 4 }}>Будет жить</label>
                    <button
                      type="button"
                      onClick={() => toggleDropdown('peopleCount')}
                      className={dropdownToggleClass(!!errors.peopleCount)}
                    >
                      <span>{peopleCount || 'Будет жить'}</span>
                      <Mi name="expand_more" size={16} color="var(--outline)" />
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
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--outline)', marginBottom: 4 }}>Ищу:</label>
                    <button
                      type="button"
                      onClick={() => toggleDropdown('searchingCount')}
                      className={dropdownToggleClass(!!errors.searchingCount)}
                    >
                      <span>{searchingCount ? `Ищу: ${searchingCount}` : 'Ищу:'}</span>
                      <Mi name="expand_more" size={16} color="var(--outline)" />
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
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--outline)', marginBottom: 4 }}>Срок</label>
                    <button
                      type="button"
                      onClick={() => toggleDropdown('term')}
                      className={dropdownToggleClass(errors.term)}
                    >
                      <span>{term}</span>
                      <Mi name="expand_more" size={16} color="var(--outline)" />
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
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--outline)', marginBottom: 4 }}>Общий: человек</label>
                    <button
                      type="button"
                      onClick={() => toggleDropdown('totalPeople')}
                      className={dropdownToggleClass(false)}
                    >
                      <span>{totalPeople} чел.</span>
                      <Mi name="expand_more" size={16} color="var(--outline)" />
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
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--outline)', marginBottom: 4 }}>Общий: человек</label>
                    <button
                      type="button"
                      onClick={() => toggleDropdown('totalPeople')}
                      className={dropdownToggleClass(errors.totalPeople)}
                    >
                      <span>{totalPeople ? `Общий: ${totalPeople}` : 'Общий:'}</span>
                      <Mi name="expand_more" size={16} color="var(--outline)" />
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

                  {/* Адрес ссылка (2GIS) */}
                  <div className="flex flex-col">
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--outline)', marginBottom: 4 }}>Адрес ссылка (2GIS)</label>
                    <input
                      type="text"
                      placeholder="https://2gis.kz/..."
                      aria-label="Ссылка на адрес (2GIS)"
                      value={addressLink}
                      onChange={(e) => {
                        setAddressLink(e.target.value)
                        setErrors((prev) => ({ ...prev, addressLink: false }))
                      }}
                      style={{ width: '100%', background: 'var(--surface-container-lowest)', border: `1px solid ${errors.addressLink ? 'var(--brand-red)' : 'var(--outline-border)'}`, borderRadius: 12, padding: '12px 16px', color: 'var(--on-surface)', fontWeight: 700, fontSize: 13, outline: 'none', minHeight: 44, fontFamily: 'inherit' }}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Row 6: Депозит & Договор */}
            <div className="grid grid-cols-2 gap-3">
              {/* Deposit */}
              <div className="relative">
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--outline)', marginBottom: 4 }}>Депозит</label>
                <button
                  type="button"
                  onClick={() => toggleDropdown('deposit')}
                  className={dropdownToggleClass(false)}
                >
                  <span>
                    {listing.mode === 'roommate' ? `Депозит: ${deposit}` : (deposit === 'Есть' ? 'Депозит есть' : 'Без депозита')}
                  </span>
                  <Mi name="expand_more" size={16} color="var(--outline)" />
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
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--outline)', marginBottom: 4 }}>Официальный договор</label>
                <button
                  type="button"
                  onClick={() => toggleDropdown('contract')}
                  className={dropdownToggleClass(false)}
                >
                  <span>
                    {listing.mode === 'roommate' ? `Договор: ${contract}` : (contract === 'Есть' ? 'Договор есть' : 'Без договора')}
                  </span>
                  <Mi name="expand_more" size={16} color="var(--outline)" />
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

            {/* Row 7: Бюджет */}
            <div className="grid grid-cols-2 gap-3">
              {/* Budget From */}
              <div className="relative">
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--outline)', marginBottom: 4 }}>Бюджет От (₸)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="от"
                  aria-label="Бюджет от, в тенге"
                  value={formatBudgetDisplay(priceFrom)}
                  onKeyDown={handleNumberKeyDown}
                  onChange={(e) => {
                    setPriceFrom(e.target.value.replace(/\D/g, ''))
                    setErrors((prev) => ({ ...prev, priceFrom: false }))
                  }}
                  style={{ width: '100%', background: 'var(--surface-container-lowest)', border: `1px solid ${errors.priceFrom ? 'var(--brand-red)' : 'var(--outline-border)'}`, borderRadius: 12, padding: '14px 16px', color: 'var(--on-surface)', fontWeight: 700, fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
                />
              </div>

              {/* Budget To */}
              <div className="relative">
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--outline)', marginBottom: 4 }}>Бюджет До (₸)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="до"
                  aria-label="Бюджет до, в тенге"
                  value={formatBudgetDisplay(priceTo)}
                  onKeyDown={handleNumberKeyDown}
                  onChange={(e) => {
                    setPriceTo(e.target.value.replace(/\D/g, ''))
                    setErrors((prev) => ({ ...prev, priceTo: false }))
                  }}
                  style={{ width: '100%', background: 'var(--surface-container-lowest)', border: `1px solid ${errors.priceTo ? 'var(--brand-red)' : 'var(--outline-border)'}`, borderRadius: 12, padding: '14px 16px', color: 'var(--on-surface)', fontWeight: 700, fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
                />
              </div>
            </div>

            {/* Row 8: + фото */}
            <div className="flex flex-col gap-2.5">
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--outline)' }}>
                Фотографии (загружено {photos.length} из {listing.mode === 'apartment' ? 3 : 5})
              </label>

              <div className="flex flex-wrap gap-2 items-center">
                {/* Confirmed photos */}
                {photos.map((ph, idx) => (
                  <div key={idx} style={{ position: 'relative', width: 64, height: 64, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--outline-border)', background: 'var(--surface-container-low)', flexShrink: 0 }}>
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

                {/* Uploading previews with spinner */}
                {uploadingPreviews.map((preview, idx) => (
                  <div key={`up-${idx}`} style={{ position: 'relative', width: 64, height: 64, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--outline-border)', background: 'var(--surface-container-low)', flexShrink: 0 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} className="w-full h-full object-cover opacity-50" alt="Загрузка" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    </div>
                  </div>
                ))}

                {/* Upload button */}
                {(photos.length + uploadingPreviews.length) < (listing.mode === 'apartment' ? 3 : 5) && !isUploadingPhotos && (
                  <div style={{ position: 'relative', width: 64, height: 64, borderRadius: 12, border: `1px dashed ${errors.photos ? 'var(--brand-red)' : 'var(--outline)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-container-low)', cursor: 'pointer' }}>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoSelect}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                    />
                    <Mi name="photo_camera" size={20} color="var(--brand-blue)" />
                  </div>
                )}
              </div>
            </div>

            {/* Row 9: Описание */}
            <div className="flex flex-col">
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--outline)', marginBottom: 4 }}>Описание объявления</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value)
                  setErrors((prev) => ({ ...prev, description: false }))
                }}
                style={{ width: '100%', background: 'var(--surface-container-lowest)', border: `1px solid ${errors.description ? 'var(--brand-red)' : 'var(--outline-border)'}`, borderRadius: 12, padding: '14px 16px', color: 'var(--on-surface)', fontWeight: 500, fontSize: 13, outline: 'none', lineHeight: 1.6, resize: 'none', fontFamily: 'inherit' }}
              />
            </div>

            {/* Bottom Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, marginTop: 8, paddingTop: 12, borderTop: '1px solid var(--outline-border)' }}>
              <div style={{ width: '45%', display: 'flex', flexDirection: 'column' }}>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--outline)', marginBottom: 6 }}>Телефон</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: 14, fontWeight: 700, color: 'var(--on-surface)', fontSize: 14 }}>+7</span>
                  <input
                    type="text"
                    value={formatPhoneDisplay(phone)}
                    onChange={handlePhoneChange}
                    style={{ width: '100%', background: 'var(--surface-container-lowest)', border: `1px solid ${errors.phone ? 'var(--brand-red)' : 'var(--outline-border)'}`, borderRadius: 12, padding: '10px 12px 10px 40px', color: 'var(--on-surface)', fontWeight: 700, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting || isUploadingPhotos}
                style={{ width: '50%', height: 44, background: 'var(--brand-blue-container)', color: '#FFF', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: (isSubmitting || isUploadingPhotos) ? 0.7 : 1 }}
              >
                {isUploadingPhotos ? 'Загрузка фото…' : isSubmitting ? 'Сохранение…' : 'Готово'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}
