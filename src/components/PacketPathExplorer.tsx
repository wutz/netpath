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
    <section className="my-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-e2">
      <header className="border-b border-gray-100 bg-gray-50 px-4 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded border border-brand-200 bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
              路径推演
            </span>
            <span className="text-sm font-medium text-gray-800">一个包经过的每一跳</span>
          </div>
          <button
            type="button"
            onClick={() => setShowObserve((v) => !v)}
            className="shrink-0 text-xs text-gray-500 transition hover:text-gray-900"
          >
            {showObserve ? '隐藏观测命令' : '显示观测命令'}
          </button>
        </div>

        {list.length > 1 && (
          <div className="-mx-1 mt-2.5 flex gap-1 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {list.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => pick(item.id)}
                aria-pressed={item.id === active.id}
                className={`shrink-0 rounded-md border px-2.5 py-1 text-xs transition ${
                  item.id === active.id
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-2.5">
        <p className="text-sm text-gray-700">{active.summary}</p>
        <div className="flex shrink-0 items-center gap-3 text-[11px] text-gray-500">
          <span>
            <span className="font-mono">{active.hops.length}</span> 跳
          </span>
          <span>
            延迟量级 <span className="font-mono">{active.latency}</span>
          </span>
          <button
            type="button"
            onClick={() => setOpenHops(allOpen ? [] : active.hops.map((h) => h.id))}
            className="font-medium text-brand-700 transition hover:text-brand-800"
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

      <footer className="border-t border-brand-200 bg-brand-50 px-4 py-3.5">
        <div className="text-xs font-medium text-brand-800">这条路径要记住的一句话</div>
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
          className="flex w-full items-start gap-2 rounded-md px-1.5 py-1.5 text-left transition hover:bg-gray-50"
        >
          <span className="mt-0.5 w-4 shrink-0 font-mono text-[11px] text-gray-500">
            {index + 1}
          </span>
          <span className="min-w-0 flex-1">
            <span className="text-sm font-medium text-gray-900">{hop.title}</span>
            <span className={`ml-2 rounded px-1.5 py-0.5 text-[11px] ${meta.chip}`}>
              {meta.label}
            </span>
          </span>
          <span className="mt-0.5 shrink-0 font-mono text-xs text-gray-500">
            {open ? '−' : '+'}
          </span>
        </button>

        {open && (
          <div className="mt-1.5 space-y-2.5 pl-6">
            <p className="text-sm leading-relaxed text-gray-600">{hop.detail}</p>

            {showObserve && hop.observe && (
              <div>
                <div className="mb-1.5 font-mono text-[11px] text-gray-500">怎么看</div>
                <pre className="overflow-x-auto overscroll-x-contain rounded-md bg-gray-900 px-3 py-2.5 font-mono text-[12px] leading-relaxed text-gray-100">
                  {hop.observe}
                </pre>
              </div>
            )}

            {hop.risk && (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-relaxed text-rose-900">
                <span className="font-medium">这一跳怎么坏：</span>
                {hop.risk}
              </div>
            )}
          </div>
        )}
      </div>
    </li>
  )
}
