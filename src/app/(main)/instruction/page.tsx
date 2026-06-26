'use client'

import React, { useState } from 'react'
import { Header } from '@/components/header'
import {
  MapPin, Home, User, Users, Calendar, Coins, FileText,
  Clock, Map, MessageCircle, ChevronDown, ChevronUp,
  ShieldCheck, AlertCircle, Trash2, Star, Phone
} from 'lucide-react'

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

const rulesItems = [
  {
    icon: ShieldCheck,
    title: 'Достоверность информации',
    desc: 'Все данные в объявлении должны быть правдивыми. Ложная информация о цене, местоположении или условиях проживания запрещена.',
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-950/20',
  },
  {
    icon: AlertCircle,
    title: 'Запрет дублирования',
    desc: 'Создание нескольких идентичных объявлений с одного аккаунта запрещено. Лимит — 5 активных объявлений на одного пользователя.',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
  },
  {
    icon: Trash2,
    title: 'Срок жизни объявления',
    desc: 'Каждое объявление автоматически удаляется через 20 дней с момента публикации. Платный ТОП продлевает срок жизни объявления.',
    color: 'text-brand-red dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/20',
  },
  {
    icon: Star,
    title: 'Платное продвижение',
    desc: 'ТОП-объявления отображаются первыми в ленте. Доступны тарифы на 3, 7 и 30 дней. После окончания даётся 3 дня буфера.',
    color: 'text-brand-blue',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
  },
  {
    icon: Phone,
    title: 'Контактные данные',
    desc: 'Указывайте только действующий номер WhatsApp. Номера сторонних лиц, агентов без явного согласования запрещены.',
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/20',
  },
]

const faqItems = [
  {
    q: 'Сколько объявлений я могу опубликовать?',
    a: 'Максимум 5 активных объявлений одновременно. Чтобы добавить новое — удалите одно из существующих.',
  },
  {
    q: 'Как долго живёт моё объявление?',
    a: '20 дней с момента публикации. Если вы купили ТОП — объявление живёт весь срок тарифа + 3 дня буфера после его окончания.',
  },
  {
    q: 'Как попасть в ТОП ленты?',
    a: 'В личном кабинете нажмите «Рекламировать» под своим объявлением и выберите тариф: 3, 7 или 30 дней.',
  },
  {
    q: 'Что значит кнопка «2ГИС» на карточке?',
    a: 'Открывает точное местоположение квартиры на карте 2ГИС. Это помогает убедиться в реальности адреса до звонка.',
  },
  {
    q: 'Как связаться с автором объявления?',
    a: 'Нажмите синюю кнопку «Ватцап» на карточке — откроется чат WhatsApp напрямую с автором объявления.',
  },
  {
    q: 'Могу ли я редактировать объявление после публикации?',
    a: 'Да. В разделе «Мой кабинет» — «Мои объявления» нажмите «Редактировать» под нужным объявлением.',
  },
]

export default function InstructionPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const handleContactAdmin = () => {
    window.open('https://wa.me/77754737619', '_blank')
  }

  return (
    <div className="flex flex-col w-full h-full">
      <Header type="title" title="инструкция" showHelpToggle={false} />

      <div className="flex-1 px-4 py-4 overflow-y-auto flex flex-col gap-6 pb-6">

        {/* ——— SECTION: Иконки полей ——— */}
        <section className="flex flex-col gap-2">
          <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-brand-gray px-1">
            Что означают поля
          </h2>
          <div className="flex flex-col gap-2.5">
            {instructionItems.map((item, idx) => {
              const Icon = item.icon
              return (
                <div
                  key={idx}
                  className="flex gap-3.5 items-start bg-white dark:bg-brand-card-dark rounded-2xl p-4 border border-gray-200/50 dark:border-zinc-800/50 transition-colors duration-150"
                >
                  <div className="w-9 h-9 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 text-xs">
                    <span className="font-extrabold text-brand-black dark:text-brand-white leading-tight">
                      {item.title}
                    </span>
                    <span className="text-brand-gray font-medium leading-relaxed mt-0.5">
                      {item.desc}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ——— SECTION: Правила платформы ——— */}
        <section className="flex flex-col gap-2">
          <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-brand-gray px-1">
            Правила платформы
          </h2>
          <div className="flex flex-col gap-2.5">
            {rulesItems.map((item, idx) => {
              const Icon = item.icon
              return (
                <div
                  key={idx}
                  className={`flex gap-3.5 items-start ${item.bg} rounded-2xl p-4 border border-transparent transition-colors duration-150`}
                >
                  <div className={`w-9 h-9 rounded-xl bg-white/50 dark:bg-black/20 flex items-center justify-center shrink-0 ${item.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 text-xs">
                    <span className={`font-extrabold leading-tight ${item.color}`}>
                      {item.title}
                    </span>
                    <span className="text-brand-black dark:text-zinc-300 font-medium leading-relaxed mt-0.5">
                      {item.desc}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ——— SECTION: FAQ ——— */}
        <section className="flex flex-col gap-2">
          <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-brand-gray px-1">
            Часто задаваемые вопросы
          </h2>
          <div className="flex flex-col gap-2">
            {faqItems.map((item, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-brand-card-dark rounded-2xl border border-gray-200/50 dark:border-zinc-800/50 overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
                >
                  <span className="text-xs font-bold text-brand-black dark:text-brand-white leading-snug">
                    {item.q}
                  </span>
                  {openFaq === idx
                    ? <ChevronUp className="w-4 h-4 text-brand-blue shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-brand-gray shrink-0" />
                  }
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4">
                    <p className="text-xs text-brand-gray font-medium leading-relaxed">
                      {item.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ——— Contact Admin ——— */}
        <button
          onClick={handleContactAdmin}
          className="w-full bg-brand-blue text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2 hover:bg-blue-600 active:scale-[0.98] transition-all duration-200 shadow-sm text-sm"
        >
          <MessageCircle className="w-5 h-5 shrink-0" />
          Связаться с администратором
        </button>

      </div>
    </div>
  )
}
