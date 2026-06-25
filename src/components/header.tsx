'use client'

import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import { ChevronLeft, Heart, User, Eye, Plus } from 'lucide-react'
import { SortIcon, SunIcon, MoonIcon, HelpIcon } from '@/components/icons'

interface HeaderProps {
  type: 'mode-toggle' | 'title'
  title?: string
  showBack?: boolean
  backUrl?: string
  onBack?: () => void
  showThemeToggle?: boolean
  showHelpToggle?: boolean
}

export function Header({
  type,
  title = '',
  showBack = false,
  backUrl,
  onBack,
  showThemeToggle = true,
  showHelpToggle = false,
}: HeaderProps) {
  const router = useRouter()
  const { mode, setMode, theme, setTheme } = useAppStore()

  const handleToggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else if (backUrl) {
      router.push(backUrl)
    } else {
      router.back()
    }
  }

  const showRightActions = showThemeToggle || showHelpToggle
  const hasLeftIcon = type === 'title'

  return (
    <div className={`w-full flex items-center transition-all duration-200 ease-in-out justify-between px-4 sticky top-0 z-40 bg-brand-bg-light dark:bg-brand-bg-dark ${
      type === 'mode-toggle' ? 'pt-3 pb-1' : 'py-3'
    } ${
      type !== 'mode-toggle' ? 'gap-[4px]' : ''
    }`}>
      <div className={`bg-[#000000] dark:bg-[#313131] text-white rounded-[54px] flex items-center shadow-md isolate transition-all duration-200 ease-in-out ${
        type === 'mode-toggle' && !showRightActions
          ? 'w-[339px] p-[3px] min-h-[41px] h-[41px] mx-auto'
          : type === 'mode-toggle'
            ? 'flex-grow flex-1 p-[3px] min-h-[41px] h-[41px]'
            : 'flex-grow flex-1 h-[36px] min-h-[36px] p-[4px] relative'
      }`}>
        {type === 'mode-toggle' ? (
          <div className="w-full h-full relative flex items-center text-[16px]">
            {/* Layer 1: Background text (White / Inactive) */}
            <div className="absolute inset-0 flex justify-between items-center z-0">
              <button
                type="button"
                onClick={() => setMode('apartment')}
                className="h-full flex items-center justify-center text-white opacity-60 tracking-wide font-normal font-unbounded text-[16px] focus:outline-none"
                style={{ width: 'calc(50% - 1.5px)' }}
              >
                ищу квартиру
              </button>
              <button
                type="button"
                onClick={() => setMode('roommate')}
                className="h-full flex items-center justify-center text-white opacity-60 tracking-wide font-normal font-unbounded text-[16px] focus:outline-none"
                style={{ width: 'calc(50% - 1.5px)' }}
              >
                ищу соседа
              </button>
            </div>

            {/* Sliding Pill Container (Mask) */}
            <div
              className="absolute top-0 bottom-0 left-0 rounded-[54px] bg-[#FFFFFF] transition-all duration-300 ease-in-out overflow-hidden z-10 pointer-events-none"
              style={{
                width: 'calc(50% - 1.5px)',
                transform: mode === 'apartment' ? 'translateX(0)' : 'translateX(calc(100% + 3px))'
              }}
            >
              {/* Layer 2: Moving text inside the mask (Black / Active / Bold) */}
              <div
                className="absolute top-0 bottom-0 left-0 flex justify-between items-center transition-all duration-300 ease-in-out"
                style={{
                  width: 'calc(200% + 3px)',
                  transform: mode === 'apartment' ? 'translateX(0)' : 'translateX(calc(-50% - 1.5px))'
                }}
              >
                <div
                  className="h-full flex items-center justify-center text-[#000000] font-bold tracking-wide font-unbounded text-[16px]"
                  style={{ width: 'calc(50% - 1.5px)' }}
                >
                  ищу квартиру
                </div>
                <div
                  className="h-full flex items-center justify-center text-[#000000] font-bold tracking-wide font-unbounded text-[16px]"
                  style={{ width: 'calc(50% - 1.5px)' }}
                >
                  ищу соседа
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center w-full h-full relative px-[36px]">
            {showBack ? (
              <button
                onClick={handleBack}
                className="absolute left-0 top-0 w-[28px] h-[28px] rounded-full bg-[#FFFFFF] flex items-center justify-center text-[#000000] hover:text-[#007BFF] active:scale-90 transition-all duration-200 cursor-pointer"
                aria-label="Назад"
                type="button"
              >
                <ChevronLeft className="w-[15px] h-[15px] text-[#000000] stroke-[2.5]" />
              </button>
            ) : (
              <div className="absolute left-0 top-0 w-[28px] h-[28px] rounded-full bg-[#FFFFFF] flex items-center justify-center shrink-0">
                {title === 'корзина' ? (
                  <Heart className="w-[14px] h-[14px] text-[#000000] fill-[#000000]" />
                ) : title === 'мой кабинет' ? (
                  <User className="w-[15px] h-[15px] text-[#000000] stroke-[2.5]" />
                ) : title === 'просмотрено' ? (
                  <Eye className="w-[15px] h-[15px] text-[#000000] stroke-[2.5]" />
                ) : (
                  <Plus className="w-[15px] h-[15px] text-[#000000] stroke-[2.5]" />
                )}
              </div>
            )}
            <span className={`${
              (title === 'корзина' || title === 'мой кабинет' || title === 'просмотрено' || title === 'объявление' || title === 'редактировать' || title === 'рекламировать' || title === 'инструкция' || title === 'ищу квартиру' || title === 'ищу соседа' || title === 'фильтр')
                ? 'font-unbounded font-medium text-[16px]'
                : 'font-bold text-sm'
            } tracking-wide lowercase truncate text-center`}>
              {title}
            </span>
          </div>
        )}
      </div>

      {/* Right Action Icons / Capsules */}
      {showRightActions && (
        <div className="flex items-center shrink-0">
          {/* Condition 3: 3 icons (Sort, Sun, Help) - favorites/basket ('корзина') */}
          {title === 'корзина' ? (
            <div className="w-[124px] h-[36px] min-h-[36px] bg-[#000000] dark:bg-[#313131] text-white rounded-[54px] flex items-center justify-between px-3 shadow-md">
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('toggle-favorites-sort'))
                }}
                className="text-white hover:text-brand-blue active:scale-90 transition-all duration-200 cursor-pointer flex items-center justify-center"
                aria-label="Сортировка"
              >
                <SortIcon className="text-white shrink-0" />
              </button>
              <button
                onClick={handleToggleTheme}
                className="text-white hover:text-brand-blue active:scale-90 transition-all duration-200 cursor-pointer flex items-center justify-center"
                aria-label="Смена темы"
              >
                {theme === 'light' ? (
                  <SunIcon className="text-white shrink-0" />
                ) : (
                  <MoonIcon className="text-white shrink-0" />
                )}
              </button>
              <button
                onClick={() => router.push('/instruction')}
                className="text-white hover:text-brand-blue active:scale-90 transition-all duration-200 cursor-pointer flex items-center justify-center"
                aria-label="Инструкция"
              >
                <HelpIcon className="text-white shrink-0" />
              </button>
            </div>
          ) : showThemeToggle && showHelpToggle ? (
            /* Condition 2: 2 icons (Theme, Help) */
            <div className="w-[95px] h-[36px] min-h-[36px] bg-[#000000] dark:bg-[#313131] text-white rounded-[54px] flex items-center justify-between px-3 shadow-md">
              <button
                onClick={handleToggleTheme}
                className="text-white hover:text-brand-blue active:scale-90 transition-all duration-200 cursor-pointer flex items-center justify-center"
                aria-label="Смена темы"
              >
                {theme === 'light' ? (
                  <SunIcon className="text-white shrink-0" />
                ) : (
                  <MoonIcon className="text-white shrink-0" />
                )}
              </button>
              <button
                onClick={() => router.push('/instruction')}
                className="text-white hover:text-brand-blue active:scale-90 transition-all duration-200 cursor-pointer flex items-center justify-center"
                aria-label="Инструкция"
              >
                <HelpIcon className="text-white shrink-0" />
              </button>
            </div>
          ) : (
            <>
              {showThemeToggle && (
                <button
                  onClick={handleToggleTheme}
                  className={`w-[36px] h-[36px] rounded-full flex items-center justify-center ${
                    theme === 'light' ? 'bg-[#000000] border-transparent' : 'bg-brand-card-dark border-zinc-800'
                  } border text-brand-black dark:text-brand-white shadow-sm hover:scale-105 active:scale-95 transition-all duration-200 ease-in-out`}
                  aria-label="Смена темы"
                >
                  {theme === 'light' ? (
                    <SunIcon className="text-white shrink-0" />
                  ) : (
                    <MoonIcon className="text-[#007BFF] shrink-0" />
                  )}
                </button>
              )}
              {showHelpToggle && (
                <button
                  onClick={() => router.push('/instruction')}
                  className="w-[36px] h-[36px] rounded-full flex items-center justify-center bg-[#FFFFFF] dark:bg-brand-card-dark border border-gray-200 dark:border-zinc-800 text-brand-black dark:text-brand-white shadow-sm hover:scale-105 active:scale-95 transition-all duration-200 ease-in-out"
                  aria-label="Инструкция"
                >
                  <HelpIcon className="text-[#000000] dark:text-[#FFFFFF] shrink-0" />
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
