'use client'

import React from 'react'
import { Header } from '@/components/header'
import { MapPin, Home, User, Users, Calendar, Coins, FileText, Clock, Map, MessageCircle } from 'lucide-react'

export default function InstructionPage() {
  
  const instructionItems = [
    {
      icon: MapPin,
      title: 'Геометка (город и район)',
      desc: 'Обозначает местоположение объекта недвижимости или желаемый район поиска.',
    },
    {
      icon: Home,
      title: 'Количество комнат',
      desc: 'Размерность квартиры (например, 1, 2, 3 или более комнат для проживания).',
    },
    {
      icon: User,
      title: 'Ограничения по полу',
      desc: 'Параметры пола, которые подходят автору для совместного проживания (мужской, женский или любой).',
    },
    {
      icon: Users,
      title: 'Общее число человек',
      desc: 'Сколько людей в общей сложности будут проживать в квартире.',
    },
    {
      icon: Users,
      title: 'Запрос сожителей',
      desc: 'Количество свободных мест в квартире, на которые сейчас ведется поиск руммейтов.',
    },
    {
      icon: Calendar,
      title: 'Диапазон возраста',
      desc: 'Рекомендуемые возрастные рамки сожителей для психологической совместимости.',
    },
    {
      icon: Coins,
      title: 'Депозит (залог)',
      desc: 'Сумма страхового депозита. Может отсутствовать (0 ₸) или требовать обеспечения.',
    },
    {
      icon: FileText,
      title: 'Договор аренды',
      desc: 'Наличие официального письменного договора найма жилья, защищающего права сторон.',
    },
    {
      icon: Clock,
      title: 'Срок проживания',
      desc: 'Срок найма жилья (например, длительно, на несколько месяцев или посуточно).',
    },
    {
      icon: Users,
      title: 'Будет жить',
      desc: 'Количество человек, которые уже заселились или планируют заехать в квартиру.',
    },
    {
      icon: Map,
      title: 'Адрес ссылка (2ГИС)',
      desc: 'Проверенная прямая геолокационная ссылка на карту 2ГИС для подтверждения адреса квартиры.',
    },
  ]

  const handleContactAdmin = () => {
    window.open('https://wa.me/77754737619', '_blank')
  }

  return (
    <div className="min-h-screen w-full bg-zinc-100 dark:bg-zinc-950 flex flex-col justify-start items-center">
      <div className="w-full max-w-md min-h-screen bg-brand-bg-light dark:bg-brand-bg-dark flex flex-col pb-12 relative shadow-md border-x border-gray-200 dark:border-zinc-800 transition-colors duration-200 select-none">
        
        {/* Header (Back button, Title "инструкция", no help button) */}
        <Header type="title" title="инструкция" showBack={true} showHelpToggle={false} />

        <div className="flex-1 px-5 py-4 flex flex-col gap-6">
          <div className="flex flex-col gap-3.5">
            {instructionItems.map((item, idx) => {
              const Icon = item.icon
              return (
                <div key={idx} className="flex gap-4 items-start bg-white dark:bg-brand-card-dark rounded-2xl p-4 border border-gray-200/50 dark:border-zinc-800/50 transition-colors duration-150">
                  <div className="w-10 h-10 rounded-xl bg-brand-blue/15 text-brand-blue flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col gap-0.5 text-xs">
                    <span className="font-extrabold text-brand-black dark:text-brand-white leading-tight">
                      {item.title}
                    </span>
                    <span className="text-brand-gray font-semibold leading-relaxed mt-0.5">
                      {item.desc}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Contact Admin button */}
          <button
            onClick={handleContactAdmin}
            className="w-full bg-brand-blue text-white rounded-2xl py-4 font-bold text-center flex items-center justify-center gap-2 hover:bg-blue-600 active:scale-98 transition-all duration-200 shadow-sm text-sm mt-2"
          >
            <MessageCircle className="w-5 h-5 shrink-0" />
            Связаться с автором
          </button>
        </div>

      </div>
    </div>
  )
}
