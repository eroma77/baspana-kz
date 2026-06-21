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
    <div className="w-full flex items-center justify-between px-4 py-3 sticky top-0 z-40 bg-brand-bg-light dark:bg-brand-bg-dark transition-all duration-200 ease-in-out">
      {/* Capsule Container */}
      <div className={`bg-[#000000] text-white rounded-full flex items-center px-1 py-1 min-h-[44px] shadow-md ${type === 'mode-toggle' && !showRightActions ? 'w-full' : 'flex-1 max-w-[280px]'}`}>
        {type === 'mode-toggle' ? (
          <div className="flex w-full justify-between items-center text-[13px] relative">
            <button
              onClick={() => setMode('apartment')}
              className={`flex-1 text-center py-2 px-3 rounded-full transition-all duration-200 ease-in-out tracking-wide ${
                mode === 'apartment'
                  ? 'bg-[#FFFFFF] text-[#000000] font-bold'
                  : 'bg-transparent text-[#FFFFFF] font-medium'
              }`}
            >
              ищу квартиру
            </button>
            <button
              onClick={() => setMode('roommate')}
              className={`flex-1 text-center py-2 px-3 rounded-full transition-all duration-200 ease-in-out tracking-wide ${
                mode === 'roommate'
                  ? 'bg-[#FFFFFF] text-[#000000] font-bold'
                  : 'bg-transparent text-[#FFFFFF] font-medium'
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

