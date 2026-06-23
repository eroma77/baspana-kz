'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import { Flame, Heart, Plus, Eye, User } from 'lucide-react'

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAppStore()

  const tabs = [
    { name: 'Лента', path: '/', icon: Flame },
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
    <div className="absolute bottom-6 left-0 right-0 z-40 px-4 pointer-events-none select-none">
      <div className="w-[340px] h-[64px] mx-auto bg-[#000000] rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.3)] flex justify-between items-center px-3 border border-zinc-900 pointer-events-auto transition-all duration-200 ease-in-out">
        {tabs.map((tab) => {
          const isActive = pathname === tab.path
          const Icon = tab.icon

          return (
            <Link
              key={tab.path}
              href={tab.path}
              onClick={(e) => handleTabClick(e, tab)}
              className="flex items-center justify-center"
              aria-label={tab.name}
            >
              {isActive ? (
                // Active: White outer circle, blue inner circle, white icon
                <div className="w-[44px] h-[44px] rounded-full bg-white flex items-center justify-center shadow-lg scale-105 transition-all duration-200">
                  <div className="w-[36px] h-[36px] rounded-full bg-[#007BFF] flex items-center justify-center text-white">
                    <Icon className="w-5 h-5 stroke-[2.5px] fill-current" />
                  </div>
                </div>
              ) : (
                // Inactive: Solid white circle with black icon
                <div className="w-[44px] h-[44px] rounded-full bg-white flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95 shadow-sm">
                  <Icon className="w-5 h-5 text-black stroke-[2.5px]" />
                </div>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
