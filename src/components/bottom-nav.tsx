'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import { Mi } from '@/components/icons'

const TABS = [
  { name: 'Лента',      path: '/',          icon: 'local_fire_department' },
  { name: 'Избранное',  path: '/favorites', icon: 'favorite' },
  { name: 'Добавить',   path: '/add',       icon: 'add_circle', isAction: true },
  { name: 'Просмотрено',path: '/viewed',    icon: 'visibility' },
  { name: 'Профиль',    path: '/profile',   icon: 'person' },
] as const

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAppStore()

  const handleTabClick = (e: React.MouseEvent, tab: typeof TABS[number]) => {
    if ('isAction' in tab && tab.isAction) {
      if (!user) {
        e.preventDefault()
        router.push('/profile')
      }
    }
  }

  return (
    <nav
      aria-label="Навигация"
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        height: 84,
        padding: '8px 20px 24px',
        background: 'var(--surface-blur-bot)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        boxShadow: 'var(--shadow-nav)',
        userSelect: 'none',
      }}
    >
      {TABS.map((tab) => {
        const isActive = pathname === tab.path
        return (
          <Link
            key={tab.path}
            href={tab.path}
            onClick={(e) => handleTabClick(e, tab)}
            aria-label={tab.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 4,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: isActive ? 'var(--brand-blue)' : 'var(--secondary)',
              opacity: isActive ? 1 : 0.65,
              transform: isActive ? 'scale(1.10)' : 'scale(1)',
              transition: 'all 200ms var(--ease)',
            }}
          >
            <Mi name={tab.icon} filled={isActive} size={26} />
          </Link>
        )
      })}
    </nav>
  )
}
