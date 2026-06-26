import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Профиль',
  description: 'Мой кабинет на Baspana.kz — управляйте своими объявлениями о поиске жилья и соседей.',
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
