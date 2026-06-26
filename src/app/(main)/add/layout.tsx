import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Добавить объявление',
  description: 'Разместите бесплатное объявление о поиске квартиры или соседа на Baspana.kz.',
}

export default function AddLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
