import React from 'react'

/* ─────────────────────────────────────────────────────────────────────
   Mi — Material Symbols Outlined wrapper
   Usage:  <Mi name="favorite" />
           <Mi name="favorite" filled />
           <Mi name="location_on" size={20} color="var(--outline)" />
───────────────────────────────────────────────────────────────────── */

interface MiProps {
  name: string
  filled?: boolean
  size?: number
  color?: string
  className?: string
  style?: React.CSSProperties
}

export function Mi({ name, filled = false, size = 18, color, className = '', style }: MiProps) {
  return (
    <span
      className={`mi${filled ? ' filled' : ''} ${className}`.trim()}
      style={{ fontSize: size, color, lineHeight: 1, userSelect: 'none', ...style }}
      aria-hidden="true"
    >
      {name}
    </span>
  )
}

/* ─────────────────────────────────────────────────────────────────────
   Named icon wrappers — keep old import names working
───────────────────────────────────────────────────────────────────── */

interface IconProps {
  className?: string
  size?: number
  color?: string
}

export function SortIcon({ size = 20, color, className }: IconProps) {
  return <Mi name="swap_vert" size={size} color={color} className={className} />
}

export function SunIcon({ size = 20, color, className }: IconProps) {
  return <Mi name="light_mode" size={size} color={color} className={className} />
}

export function MoonIcon({ size = 20, color, className }: IconProps) {
  return <Mi name="dark_mode" size={size} color={color} className={className} />
}

export function HelpIcon({ size = 20, color, className }: IconProps) {
  return <Mi name="help_outline" size={size} color={color} className={className} />
}

export function FilterIcon({ size = 20, color, className }: IconProps) {
  return <Mi name="tune" size={size} color={color} className={className} />
}
