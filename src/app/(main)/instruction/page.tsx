'use client'

import { useState } from 'react'
import { Header } from '@/components/header'
import { Mi } from '@/components/icons'

const instructionItems = [
  { icon: 'location_on',   title: 'Геометка (город и район)',  desc: 'Обозначает местоположение объекта недвижимости или желаемый район поиска.' },
  { icon: 'home',          title: 'Количество комнат',         desc: 'Размерность квартиры (например, 1, 2, 3 или более комнат для проживания).' },
  { icon: 'person',        title: 'Ограничения по полу',       desc: 'Параметры пола, которые подходят автору для совместного проживания (мужской, женский или любой).' },
  { icon: 'group',         title: 'Общее число человек',       desc: 'Сколько людей в общей сложности будут проживать в квартире.' },
  { icon: 'manage_search', title: 'Запрос сожителей',          desc: 'Количество свободных мест в квартире, на которые сейчас ведется поиск руммейтов.' },
  { icon: 'cake',          title: 'Диапазон возраста',         desc: 'Рекомендуемые возрастные рамки сожителей для психологической совместимости.' },
  { icon: 'attach_money',  title: 'Депозит (залог)',            desc: 'Сумма страхового депозита. Может отсутствовать (0 ₸) или требовать обеспечения.' },
  { icon: 'description',   title: 'Договор аренды',            desc: 'Наличие официального письменного договора найма жилья, защищающего права сторон.' },
  { icon: 'schedule',      title: 'Срок проживания',           desc: 'Срок найма жилья (например, длительно, на несколько месяцев или посуточно).' },
  { icon: 'groups',        title: 'Будет жить',                desc: 'Количество человек, которые уже заселились или планируют заехать в квартиру.' },
  { icon: 'map',           title: 'Адрес ссылка (2ГИС)',       desc: 'Проверенная прямая геолокационная ссылка на карту 2ГИС для подтверждения адреса квартиры.' },
]

const rulesItems = [
  { icon: 'verified_user', title: 'Достоверность информации', desc: 'Все данные в объявлении должны быть правдивыми. Ложная информация о цене, местоположении или условиях проживания запрещена.', iconColor: 'var(--brand-green)', bg: 'var(--card-green-bg)', border: 'var(--card-green-border)' },
  { icon: 'error',         title: 'Запрет дублирования',      desc: 'Создание нескольких идентичных объявлений с одного аккаунта запрещено. Лимит — 5 активных объявлений на одного пользователя.',   iconColor: '#D97706', bg: 'var(--card-yellow-bg)', border: 'var(--card-yellow-border)' },
  { icon: 'delete',        title: 'Срок жизни объявления',    desc: 'Каждое объявление автоматически удаляется через 20 дней с момента публикации. Платный ТОП продлевает срок жизни объявления.',      iconColor: 'var(--brand-red)', bg: 'var(--brand-red-soft)', border: 'var(--brand-red-border)' },
  { icon: 'star',          title: 'Платное продвижение',       desc: 'ТОП-объявления отображаются первыми в ленте. Доступны тарифы на 3, 7 и 30 дней. После окончания даётся 3 дня буфера.',             iconColor: 'var(--brand-blue)', bg: 'var(--brand-blue-soft)', border: 'rgba(0,67,200,0.15)' },
  { icon: 'phone',         title: 'Контактные данные',         desc: 'Указывайте только действующий номер WhatsApp. Номера сторонних лиц, агентов без явного согласования запрещены.',                    iconColor: '#7C3AED', bg: 'var(--card-purple-bg)', border: 'var(--card-purple-border)' },
]

const faqItems = [
  { q: 'Сколько объявлений я могу опубликовать?',           a: 'Максимум 5 активных объявлений одновременно. Чтобы добавить новое — удалите одно из существующих.' },
  { q: 'Как долго живёт моё объявление?',                    a: '20 дней с момента публикации. Если вы купили ТОП — объявление живёт весь срок тарифа + 3 дня буфера после его окончания.' },
  { q: 'Как попасть в ТОП ленты?',                           a: 'В личном кабинете нажмите «Рекламировать» под своим объявлением и выберите тариф: 3, 7 или 30 дней.' },
  { q: 'Что значит кнопка «2ГИС» на карточке?',             a: 'Открывает точное местоположение квартиры на карте 2ГИС. Это помогает убедиться в реальности адреса до звонка.' },
  { q: 'Как связаться с автором объявления?',                a: 'Нажмите синюю кнопку «Ватцап» на карточке — откроется чат WhatsApp напрямую с автором объявления.' },
  { q: 'Могу ли я редактировать объявление после публикации?', a: 'Да. В разделе «Мой кабинет» — «Мои объявления» нажмите «Редактировать» под нужным объявлением.' },
]

export default function InstructionPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="flex flex-col w-full h-full">
      <Header type="title" title="инструкция" showHelpToggle={false} />

      <div className="flex-1 overflow-y-auto" style={{ padding: '16px 20px 110px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Fields reference */}
        <section>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--outline)', marginBottom: 10, paddingLeft: 2 }}>
            Что означают поля
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {instructionItems.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-border)', borderRadius: 16, padding: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: 'var(--brand-blue-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Mi name={item.icon} size={18} color="var(--brand-blue)" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface)', letterSpacing: '-0.1px', lineHeight: 1.3 }}>{item.title}</span>
                  <span style={{ fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.5, letterSpacing: '-0.1px' }}>{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Rules */}
        <section>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--outline)', marginBottom: 10, paddingLeft: 2 }}>
            Правила платформы
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rulesItems.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', background: item.bg, border: `1px solid ${item.border}`, borderRadius: 16, padding: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: 'var(--card-icon-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Mi name={item.icon} size={18} color={item.iconColor} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: item.iconColor, letterSpacing: '-0.1px', lineHeight: 1.3 }}>{item.title}</span>
                  <span style={{ fontSize: 12, color: 'var(--on-surface)', lineHeight: 1.5, letterSpacing: '-0.1px' }}>{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--outline)', marginBottom: 10, paddingLeft: 2 }}>
            Часто задаваемые вопросы
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {faqItems.map((item, idx) => {
              const open = openFaq === idx
              return (
                <div key={idx} style={{ background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-border)', borderRadius: 16, overflow: 'hidden' }}>
                  <button
                    onClick={() => setOpenFaq(open ? null : idx)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface)', lineHeight: 1.35, letterSpacing: '-0.1px' }}>{item.q}</span>
                    <Mi name={open ? 'expand_less' : 'expand_more'} size={20} color={open ? 'var(--brand-blue)' : 'var(--outline)'} style={{ flexShrink: 0 }} />
                  </button>
                  {open && (
                    <div style={{ padding: '0 16px 14px', fontSize: 13, color: 'var(--on-surface-variant)', lineHeight: 1.55, letterSpacing: '-0.1px' }}>
                      {item.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* Contact admin */}
        <button
          onClick={() => window.open('https://wa.me/77754737619', '_blank')}
          style={{ width: '100%', minHeight: 64, padding: '16px 20px', background: 'var(--brand-blue-container)', color: '#FFF', border: 'none', borderRadius: 20, fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, letterSpacing: '-0.2px', marginTop: 8 }}
        >
          <Mi name="chat" size={20} color="#FFF" />
          Связаться с администратором
        </button>

      </div>
    </div>
  )
}
