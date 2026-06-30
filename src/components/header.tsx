'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import { Mi } from '@/components/icons'

interface HeaderProps {
  type: 'mode-toggle' | 'title'
  title?: string
  showBack?: boolean
  backUrl?: string
  onBack?: () => void
  showThemeToggle?: boolean
  showHelpToggle?: boolean
}

const BLUR_HEADER: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 40,
  background: 'var(--surface-blur-top)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  borderBottom: '1px solid var(--outline-border)',
  padding: '12px 20px',
}

const ICON_BTN = {
  width: 40,
  height: 40,
  borderRadius: 9999,
  background: 'var(--surface-container-low)',
  border: '1px solid var(--outline-border)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--on-surface-variant)',
  cursor: 'pointer',
  flexShrink: 0,
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
  const { mode, setMode, theme, setTheme, filters } = useAppStore()

  // Count how many filters deviate from their neutral ("any") value, so the
  // фильтр button can show whether filtering is currently active.
  const NEUTRAL = ['Не важно', '-', '']
  const f = filters
  const activeFilterCount =
    (f.city ? 1 : 0) +
    (NEUTRAL.includes(f.district) ? 0 : 1) +
    (NEUTRAL.includes(f.gender) ? 0 : 1) +
    // Age is one filter even though apartment mode fills both from/to.
    (f.ageFrom || f.ageTo ? 1 : 0) +
    (NEUTRAL.includes(f.rooms) ? 0 : 1) +
    (NEUTRAL.includes(f.peopleCount) ? 0 : 1) +
    (NEUTRAL.includes(f.searchingCount) ? 0 : 1) +
    (NEUTRAL.includes(f.canLiveWith) ? 0 : 1) +
    (NEUTRAL.includes(f.deposit) ? 0 : 1) +
    (NEUTRAL.includes(f.contract) ? 0 : 1) +
    (NEUTRAL.includes(f.term) ? 0 : 1) +
    (f.priceFrom ? 1 : 0) +
    (f.priceTo ? 1 : 0) +
    (f.onlyPhotos ? 1 : 0) +
    (f.hideViewed ? 1 : 0)
  const hasActiveFilters = activeFilterCount > 0

  const handleToggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light')

  const handleBack = () => {
    if (onBack) onBack()
    else if (backUrl) router.push(backUrl)
    else router.back()
  }

  /* ── Mode toggle (feed screen) ──────────────────────────── */
  if (type === 'mode-toggle') {
    return (
      <div style={BLUR_HEADER}>
        {/* Segmented mode control */}
        <div style={{
          display: 'flex',
          background: 'var(--surface-container-low)',
          border: '1px solid var(--outline-border)',
          borderRadius: 16,
          padding: 4,
          height: 40,
          alignItems: 'center',
          marginBottom: 8,
        }}>
          {(['apartment', 'roommate'] as const).map((m) => {
            const active = mode === m
            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  flex: 1,
                  height: 32,
                  borderRadius: 12,
                  border: 'none',
                  cursor: 'pointer',
                  background: active ? 'var(--surface-container-lowest)' : 'transparent',
                  color: active ? 'var(--on-surface)' : 'var(--secondary)',
                  fontSize: 14,
                  fontWeight: active ? 600 : 500,
                  letterSpacing: '-0.1px',
                  boxShadow: active ? 'var(--shadow-sm)' : 'none',
                  fontFamily: 'inherit',
                  transition: 'all 200ms var(--ease)',
                  transform: 'none',
                }}
              >
                {m === 'apartment' ? 'ищу квартиру' : 'ищу соседа'}
              </button>
            )
          })}
        </div>

        {/* Toolbar row */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => router.push('/filter')}
            style={{
              flex: 1,
              height: 40,
              background: hasActiveFilters ? 'var(--brand-blue-soft)' : 'var(--surface-container-low)',
              border: `1px solid ${hasActiveFilters ? 'rgba(0,67,200,0.25)' : 'var(--outline-border)'}`,
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              color: hasActiveFilters ? 'var(--brand-blue)' : 'var(--on-surface)',
              fontSize: 14,
              fontWeight: hasActiveFilters ? 600 : 500,
              cursor: 'pointer',
              letterSpacing: '-0.1px',
              fontFamily: 'inherit',
            }}
          >
            <Mi name="tune" size={18} color={hasActiveFilters ? 'var(--brand-blue)' : 'var(--on-surface-variant)'} />
            <span>фильтр</span>
            {hasActiveFilters && (
              <span style={{
                minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9999,
                background: 'var(--brand-blue-container)', color: '#FFF',
                fontSize: 11, fontWeight: 700, lineHeight: '18px', textAlign: 'center',
              }}>
                {activeFilterCount}
              </span>
            )}
          </button>

          <button
            style={ICON_BTN}
            onClick={() => window.dispatchEvent(new CustomEvent('bp:sort'))}
            aria-label="Сортировка"
          >
            <Mi name="swap_vert" size={20} />
          </button>

          {showThemeToggle && (
            <button style={ICON_BTN} onClick={handleToggleTheme} aria-label="Тема">
              <Mi name={theme === 'light' ? 'light_mode' : 'dark_mode'} size={20} />
            </button>
          )}

          {showHelpToggle && (
            <button style={ICON_BTN} onClick={() => router.push('/instruction')} aria-label="Инструкция">
              <Mi name="help_outline" size={20} />
            </button>
          )}
        </div>
      </div>
    )
  }

  /* ── Title header (other screens) ───────────────────────── */
  return (
    <div style={{ ...BLUR_HEADER, display: 'flex', alignItems: 'center', gap: 8 }}>
      {showBack ? (
        <button style={ICON_BTN} onClick={handleBack} aria-label="Назад">
          <Mi name="arrow_back" size={20} />
        </button>
      ) : (['корзина', 'мой кабинет', 'просмотрено', 'добавить'].includes(title) ? (
        <div style={{ ...ICON_BTN, cursor: 'default' }}>
          {title === 'корзина' && <Mi name="favorite" size={20} />}
          {title === 'мой кабинет' && <Mi name="person" size={20} />}
          {title === 'просмотрено' && <Mi name="visibility" size={20} />}
          {title === 'добавить' && <Mi name="add_circle" size={20} />}
        </div>
      ) : (
        <button style={ICON_BTN} onClick={() => router.back()} aria-label="Назад">
          <Mi name="arrow_back" size={20} />
        </button>
      ))}

      <div style={{
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 600,
        color: 'var(--on-surface)',
        letterSpacing: '-0.3px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {title}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {showThemeToggle && (
          <button style={ICON_BTN} onClick={handleToggleTheme} aria-label="Тема">
            <Mi name={theme === 'light' ? 'light_mode' : 'dark_mode'} size={20} />
          </button>
        )}
        {showHelpToggle && (
          <button style={ICON_BTN} onClick={() => router.push('/instruction')} aria-label="Инструкция">
            <Mi name="help_outline" size={20} />
          </button>
        )}
        {!showThemeToggle && !showHelpToggle && (
          <div style={{ width: 40, height: 40, flexShrink: 0 }} />
        )}
      </div>
    </div>
  )
}
