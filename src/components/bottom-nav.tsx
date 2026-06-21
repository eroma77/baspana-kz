'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import { Compass, Heart, Plus, Eye, User } from 'lucide-react'

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAppStore()

  const tabs = [
    { name: 'Лента', path: '/', icon: Compass },
    { name: 'Избранное', path: '/favorites', icon: Heart },
    { name: 'Добавить', path: '/add', icon: Plus, isAction: true },
    { name: 'Просмотрено', path: '/viewed', icon: Eye },
    { name: 'Профиль', path: '/profile', icon: User },
  ]

  const handleTabClick = (e: React.MouseEvent, tab: typeof tabs[0]) => {
    if (tab.isAction || tab.path === '/add') {
      // Auth Wall Guard for Add Page
      if (!user) {
        e.preventDefault()
        router.push('/profile')
      }
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-brand-card-dark border-t border-gray-200 dark:border-zinc-800 transition-all duration-200 ease-in-out">
      <div className="max-w-md mx-auto flex justify-between items-center px-4 py-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.path
          const Icon = tab.icon

          // Special style for active state: solid blue circle
          // otherwise grey/white
          return (
            <Link
              key={tab.path}
              href={tab.path}
              onClick={(e) => handleTabClick(e, tab)}
              className="flex flex-col items-center justify-center flex-1 py-1"
              aria-label={tab.name}
            >
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 ease-in-out ${
                  isActive
                    ? 'bg-brand-blue text-white shadow-md scale-105'
                    : 'text-gray-400 dark:text-gray-500 hover:text-brand-blue dark:hover:text-brand-blue'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
