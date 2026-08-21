import type { ReactNode } from 'react'

type Tone = 'note' | 'tip' | 'warn' | 'trap'

/*
 * 四种语气各自一色 —— 这里的颜色是有含义的（建议 / 注意 / 坑），不是装饰，所以保留。
 * 只把「说明」从 sky 换成主题色：sky 和主题色都是蓝青，摆在一页里分不出差别，
 * 白占一个色位。
 */
const TONE: Record<Tone, { label: string; box: string; head: string; icon: string }> = {
  note: {
    label: '说明',
    box: 'border-brand-200 bg-brand-50',
    head: 'text-brand-800',
    icon: 'i',
  },
  tip: {
    label: '实践建议',
    box: 'border-emerald-200 bg-emerald-50',
    head: 'text-emerald-800',
    icon: '✓',
  },
  warn: {
    label: '注意',
    box: 'border-amber-200 bg-amber-50',
    head: 'text-amber-900',
    icon: '!',
  },
  trap: {
    label: '新人常踩的坑',
    box: 'border-rose-200 bg-rose-50',
    head: 'text-rose-800',
    icon: '×',
  },
}

export function Callout({
  type = 'note',
  title,
  children,
}: {
  type?: Tone
  title?: string
  children: ReactNode
}) {
  const tone = TONE[type]
  return (
    <div className={`my-6 rounded-lg border px-4 py-3.5 text-sm ${tone.box}`}>
      <div className={`mb-1.5 flex items-center gap-2 font-medium ${tone.head}`}>
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/80 font-mono text-[11px]">
          {tone.icon}
        </span>
        {title ?? tone.label}
      </div>
      <div className="text-gray-700 [&>*+*]:mt-2">{children}</div>
    </div>
  )
}
