'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--surface-container-highest)' }}>
      <div style={{ textAlign: 'center', maxWidth: 360 }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--on-surface)', marginBottom: 8, letterSpacing: '-0.3px' }}>
          Что-то пошло не так
        </div>
        <p style={{ fontSize: 14, color: 'var(--on-surface-variant)', marginBottom: 24, lineHeight: 1.5 }}>
          Произошла ошибка при загрузке страницы. Попробуйте ещё раз.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={() => reset()}
            style={{ height: 44, padding: '0 24px', background: 'var(--brand-blue)', color: '#fff', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Повторить
          </button>
          <a
            href="/"
            style={{ height: 44, lineHeight: '44px', padding: '0 24px', background: 'var(--surface-container-low)', color: 'var(--on-surface)', border: '1px solid var(--outline-border)', borderRadius: 14, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
          >
            На главную
          </a>
        </div>
      </div>
    </div>
  )
}
