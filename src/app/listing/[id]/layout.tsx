import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  return {
    title: 'Объявление',
    description: 'Просмотр объявления о поиске жилья или соседа на Baspana.kz.',
    alternates: {
      canonical: `/listing/${id}`,
    },
  }
}

export default function ListingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
