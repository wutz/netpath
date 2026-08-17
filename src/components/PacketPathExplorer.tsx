import { useMemo, useState } from 'react'
import { LAYER_META, SCENARIOS, type Hop } from '#/lib/packet-path'

/**
 * 报文路径推演。
 * 选一个场景，逐跳看包经过哪里、这一跳用什么命令看、典型怎么丢。
 *
 * only 用来在课程里只放出相关的几个场景，避免正文里出现还没讲到的概念。
 */
export function PacketPathExplorer({
  scenario,
  only,
}: {
  scenario?: string
  only?: string[]
}) {
  const list = useMemo(
    () => (only?.length ? SCENARIOS.filter((s) => only.includes(s.id)) : SCENARIOS),
    [only],
  )
  const [activeId, setActiveId] = useState(scenario ?? list[0]?.id ?? SCENARIOS[0].id)
  const [openHops, setOpenHops] = useState<string[]>([])
  const [showObserve, setShowObserve] = useState(true)

  const active = list.find((s) => s.id === activeId) ?? list[0] ?? SCENARIOS[0]
  const allOpen = openHops.length === active.hops.length

  function pick(id: string) {
    setActiveId(id)
    setOpenHops([])
  }

  function toggle(hopId: string) {
    setOpenHops((prev) =>
      prev.includes(hopId) ? prev.filter((h) => h !== hopId) : [...prev, hopId],
    )
  }

  return (
    <section className="my-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <header className="border-b border-gray-100 px-4 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
              路径推演
            </span>
            <span className="text-sm font-medium text-gray-700">一个包经过的每一跳</span>
          </div>
          <button
            type="button"
            onClick={() => setShowObserve((v) => !v)}
            className="shrink-0 text-xs text-gray-400 transition hover:text-gray-700"
          >
            {showObserve ? '隐藏观测命令' : '显示观测命令'}
          </button>
        </div>

        {list.length > 1 && (
          <div className="-mx-1 mt-2.5 flex gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {list.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => pick(item.id)}
                className={`shrink-0 rounded-lg px-2.5 py-1 text-xs transition ${
                  item.id === active.id
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 px-4 py-2.5">
        <p className="text-sm text-gray-700">{active.summary}</p>
        <div className="flex shrink-0 items-center gap-3 text-[11px] text-gray-500">
          <span>{active.hops.length} 跳</span>
          <span>延迟量级 {active.latency}</span>
          <button
            type="button"
            onClick={() => setOpenHops(allOpen ? [] : active.hops.map((h) => h.id))}
            className="text-brand-600 transition hover:text-brand-700"
          >
            {allOpen ? '全部收起' : '全部展开'}
          </button>
        </div>
      </div>

      <ol className="px-4 py-3">
        {active.hops.map((hop, index) => (
          <HopRow
            key={hop.id}
            hop={hop}
            index={index}
            last={index === active.hops.length - 1}
            open={openHops.includes(hop.id)}
            showObserve={showObserve}
            onToggle={() => toggle(hop.id)}
          />
        ))}
      </ol>

      <footer className="border-t border-gray-100 bg-brand-50 px-4 py-3">
        <div className="text-xs font-semibold text-brand-700">这条路径要记住的一句话</div>
        <p className="mt-1 text-sm leading-relaxed text-gray-700">{active.takeaway}</p>
      </footer>
    </section>
  )
}

function HopRow({
  hop,
  index,
  last,
  open,
  showObserve,
  onToggle,
}: {
  hop: Hop
  index: number
  last: boolean
  open: boolean
  showObserve: boolean
  onToggle: () => void
}) {
  const meta = LAYER_META[hop.layer]

  return (
    <li className="flex gap-3">
      {/* 时间轴：圆点 + 连接线 */}
      <div className="flex flex-col items-center pt-2.5">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${meta.dot}`} />
        {!last && <span className="my-0.5 w-px flex-1 bg-gray-200" />}
      </div>

      <div className={`min-w-0 flex-1 ${last ? 'pb-1' : 'pb-3'}`}>
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-start gap-2 rounded-lg px-1.5 py-1.5 text-left transition hover:bg-gray-50"
        >
          <span className="mt-0.5 w-4 shrink-0 font-mono text-[11px] text-gray-400">
            {index + 1}
          </span>
          <span className="min-w-0 flex-1">
            <span className="text-sm font-medium text-gray-900">{hop.title}</span>
            <span className={`ml-2 rounded px-1.5 py-0.5 text-[11px] ${meta.chip}`}>
              {meta.label}
            </span>
          </span>
          <span className="mt-0.5 shrink-0 text-xs text-gray-300">{open ? '−' : '+'}</span>
        </button>

        {open && (
          <div className="mt-1 space-y-2 pl-6">
            <p className="text-sm leading-relaxed text-gray-600">{hop.detail}</p>

            {showObserve && hop.observe && (
              <div>
                <div className="mb-1 text-[11px] font-medium text-gray-400">怎么看</div>
                <pre className="overflow-x-auto overscroll-x-contain rounded-lg bg-gray-900 px-3 py-2 font-mono text-[12px] leading-relaxed text-gray-100">
                  {hop.observe}
                </pre>
              </div>
            )}

            {hop.risk && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900">
                <span className="font-semibold">这一跳怎么坏：</span>
                {hop.risk}
              </div>
            )}
          </div>
        )}
      </div>
    </li>
  )
}
