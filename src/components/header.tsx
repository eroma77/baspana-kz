'use client'

import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import { ChevronLeft, Sun, Moon, HelpCircle } from 'lucide-react'

interface HeaderProps {
  type: 'mode-toggle' | 'title'
  title?: string
  showBack?: boolean
  showThemeToggle?: boolean
  showHelpToggle?: boolean
}

export function Header({
  type,
  title = '',
  showBack = false,
  showThemeToggle = true,
  showHelpToggle = false,
}: HeaderProps) {
  const router = useRouter()
  const { mode, setMode, theme, setTheme } = useAppStore()

  const handleToggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  const showRightActions = showThemeToggle || showHelpToggle

  return (
    <div className={`w-full flex items-center justify-between px-4 sticky top-0 z-40 bg-brand-bg-light dark:bg-brand-bg-dark transition-all duration-200 ease-in-out ${type === 'mode-toggle' && !showRightActions ? 'pt-[12px] pb-0' : 'py-3'}`}>
      <div className={`bg-[#000000] text-white rounded-[54px] flex items-center p-[3px] min-h-[41px] h-[41px] shadow-md isolate ${type === 'mode-toggle' && !showRightActions ? 'w-[339px] mx-auto' : 'flex-1 max-w-[280px]'}`}>
        {type === 'mode-toggle' ? (
          <div className="flex w-full justify-between items-center text-[16px] relative h-full">
            {/* Floating White Pill */}
            <div
              className={`absolute top-0 bottom-0 w-[165px] rounded-[54px] bg-[#FFFFFF] transition-all duration-300 ease-in-out ${
                mode === 'apartment' ? 'translate-x-0' : 'translate-x-[168px]'
              }`}
            />
            <button
              onClick={() => setMode('apartment')}
              className={`relative z-10 w-[165px] h-[35px] rounded-[54px] flex items-center justify-center tracking-wide font-unbounded text-[16px] text-[#FFFFFF] mix-blend-difference transition-[font-weight] duration-0 delay-150 ${
                mode === 'apartment' ? 'font-bold' : 'font-normal'
              }`}
            >
              ищу квартиру
            </button>
            <button
              onClick={() => setMode('roommate')}
              className={`relative z-10 w-[165px] h-[35px] rounded-[54px] flex items-center justify-center tracking-wide font-unbounded text-[16px] text-[#FFFFFF] mix-blend-difference transition-[font-weight] duration-0 delay-150 ${
                mode === 'roommate' ? 'font-bold' : 'font-normal'
              }`}
            >
              ищу соседа
            </button>
          </div>
        ) : (
          <div className="flex items-center w-full px-2">
            {showBack && (
              <button
                onClick={() => router.back()}
                className="mr-2 text-white hover:text-brand-blue transition-colors duration-200"
                aria-label="Назад"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            <span className="font-bold text-sm tracking-wide lowercase truncate">
              {title}
            </span>
          </div>
        )}
      </div>

      {/* Right Action Icons */}
      {showRightActions && (
        <div className="flex items-center gap-3 pl-3">
          {showThemeToggle && (
            <button
              onClick={handleToggleTheme}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-[#FFFFFF] dark:bg-brand-card-dark border border-gray-200 dark:border-zinc-800 text-brand-black dark:text-brand-white shadow-sm hover:scale-105 active:scale-95 transition-all duration-200 ease-in-out"
              aria-label="Смена темы"
            >
              {theme === 'light' ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-brand-blue" />
              )}
            </button>
          )}
          {showHelpToggle && (
            <button
              onClick={() => router.push('/instruction')}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-[#FFFFFF] dark:bg-brand-card-dark border border-gray-200 dark:border-zinc-800 text-brand-black dark:text-brand-white shadow-sm hover:scale-105 active:scale-95 transition-all duration-200 ease-in-out"
              aria-label="Инструкция"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

