import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Избранное',
  description: 'Ваши сохранённые объявления о поиске жилья и соседей на Baspana.kz.',
}

export default function FavoritesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
