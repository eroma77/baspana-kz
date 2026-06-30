import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--surface-container-highest)' }}>
      <div style={{ textAlign: 'center', maxWidth: 360 }}>
        <div style={{ fontSize: 64, fontWeight: 800, color: 'var(--brand-blue)', letterSpacing: '-2px', lineHeight: 1 }}>404</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--on-surface)', margin: '16px 0 8px', letterSpacing: '-0.3px' }}>Страница не найдена</div>
        <p style={{ fontSize: 14, color: 'var(--on-surface-variant)', marginBottom: 24, lineHeight: 1.5 }}>
          Возможно, ссылка устарела или страница была удалена.
        </p>
        <Link
          href="/"
          style={{ display: 'inline-block', height: 44, lineHeight: '44px', padding: '0 24px', background: 'var(--brand-blue)', color: '#fff', borderRadius: 14, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
        >
          На главную
        </Link>
      </div>
    </div>
  )
}
