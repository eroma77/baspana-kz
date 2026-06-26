import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Просмотренные',
  description: 'Объявления, которые вы просмотрели на Baspana.kz.',
}

export default function ViewedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
