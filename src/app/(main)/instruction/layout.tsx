import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Инструкция',
  description: 'Как пользоваться Baspana.kz — правила платформы, описание полей и часто задаваемые вопросы.',
}

export default function InstructionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
