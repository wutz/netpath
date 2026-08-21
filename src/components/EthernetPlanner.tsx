import { useState } from 'react'
import type { ReactNode } from 'react'
import { LEAF_PRESETS, planEthernet, type EthPlanInput } from '#/lib/eth-plan'
import { formatGbps, formatNumber, formatRatio } from '#/lib/netunits'

const DEFAULTS: EthPlanInput = {
  nodes: 48,
  portsPerNode: 2,
  nodePortGbps: 25,
  leafPorts: 54,
  uplinksPerLeaf: 6,
  uplinkGbps: 100,
  spinePorts: 32,
  dualHomed: true,
}

/* 不写 outline-none —— 全局 :focus-visible 的主题色焦点圈要留出来 */
const inputCls =
  'w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition focus:border-brand-500'

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-gray-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-gray-500">{hint}</span>}
    </label>
  )
}

/** 结论色是有含义的（够用 / 紧 / 不够），这里保留语义色 */
const VERDICT_STYLE = {
  good: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  ok: 'border-amber-200 bg-amber-50 text-amber-900',
  bad: 'border-rose-200 bg-rose-50 text-rose-900',
} as const

/**
 * 结果数字块。原来 leaf 是青底、spine 是紫底、GPU 是红底 ——
 * 颜色并不携带信息，只是让三个格子看起来不一样。现在统一中性底，
 * 数字本身够大够粗，对比留给真正有语义的结论块。
 */
function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-center">
      <div className="text-xs font-medium text-gray-600">{label}</div>
      <div className="mt-1 font-mono text-2xl font-medium tracking-tight text-gray-900">
        {value}
      </div>
      {hint && <div className="mt-1 text-[11px] leading-snug text-gray-500">{hint}</div>}
    </div>
  )
}

/** 以太网 Spine-Leaf 规划计算器 */
export function EthernetPlanner() {
  const [input, setInput] = useState<EthPlanInput>(DEFAULTS)
  const result = planEthernet(input)

  const set = <K extends keyof EthPlanInput>(key: K, value: EthPlanInput[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }))

  const num = (key: keyof EthPlanInput, min = 1) => ({
    type: 'number' as const,
    min,
    value: input[key] as number,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      set(key, Math.max(min, Number(e.target.value) || min) as never),
    className: inputCls,
  })

  return (
    <section className="my-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-e2">
      <header className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="rounded border border-brand-200 bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
            计算器
          </span>
          <span className="text-sm font-medium text-gray-800">以太网 Spine-Leaf 端口账</span>
        </div>
        <button
          type="button"
          onClick={() => setInput(DEFAULTS)}
          className="text-xs text-gray-500 transition hover:text-gray-900"
        >
          重置
        </button>
      </header>

      <div className="grid gap-5 px-4 py-4 md:grid-cols-2">
        <div className="space-y-3">
          <Field label="交换机机型预设" hint="选完可以继续手工微调下面的参数">
            <select
              value={LEAF_PRESETS.findIndex(
                (p) => p.leafPorts === input.leafPorts && p.nodePortGbps === input.nodePortGbps,
              )}
              onChange={(e) => {
                const preset = LEAF_PRESETS[Number(e.target.value)]
                if (!preset) return
                setInput((prev) => ({
                  ...prev,
                  leafPorts: preset.leafPorts,
                  uplinksPerLeaf: preset.uplinksPerLeaf,
                  nodePortGbps: preset.nodePortGbps,
                  uplinkGbps: preset.uplinkGbps,
                }))
              }}
              className={inputCls}
            >
              <option value={-1}>自定义</option>
              {LEAF_PRESETS.map((preset, index) => (
                <option key={preset.label} value={index}>
                  {preset.label}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="服务器台数">
              <input {...num('nodes')} />
            </Field>
            <Field label="每台接入端口数" hint="含冗余那一路">
              <input {...num('portsPerNode')} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="接入口速率 Gbps">
              <input {...num('nodePortGbps')} />
            </Field>
            <Field label="上行口速率 Gbps">
              <input {...num('uplinkGbps')} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="leaf 总端口数">
              <input {...num('leafPorts')} />
            </Field>
            <Field label="每台 leaf 上行口数">
              <input {...num('uplinksPerLeaf')} />
            </Field>
          </div>

          <Field label="spine 总端口数">
            <input {...num('spinePorts')} />
          </Field>

          <label className="flex items-center gap-2 pt-1 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={input.dualHomed}
              onChange={(e) => set('dualHomed', e.target.checked)}
              className="h-4 w-4 shrink-0 rounded border-gray-300 accent-brand-600"
            />
            服务器双上行到两台 leaf（leaf 按偶数成对）
          </label>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Stat
              label="leaf 交换机"
              value={`${result.leafCount} 台`}
              hint={`每台可下行 ${result.downlinksPerLeaf} 口`}
            />
            <Stat
              label="spine 交换机"
              value={`${result.spineCount} 台`}
              hint={`端口用掉 ${(result.spineUtil * 100).toFixed(0)}%`}
            />
          </div>

          <div className={`rounded-lg border px-3 py-3 ${VERDICT_STYLE[result.verdict.tone]}`}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-medium">收敛比（下行 : 上行）</span>
              <span className="shrink-0 rounded bg-white/70 px-1.5 py-0.5 text-[11px] font-medium">
                {result.verdict.label}
              </span>
            </div>
            <div className="mt-1 font-mono text-2xl font-medium tracking-tight">
              {formatRatio(result.oversubscription)}
            </div>
            <div className="mt-1 text-[11px]">
              单台 leaf 下行 {formatGbps(result.leafDownGbps)} ／ 上行{' '}
              {formatGbps(result.leafUpGbps)}
            </div>
          </div>

          <dl className="divide-y divide-gray-100 rounded-lg border border-gray-200 px-3 text-sm">
            {[
              ['接入端口总数', `${formatNumber(result.accessPorts)} 个`],
              ['接入线缆', `${formatNumber(result.accessCables)} 根`],
              ['spine-leaf 线缆', `${formatNumber(result.spineLeafCables)} 根`],
              ['下行口余量', `${formatNumber(result.sparePorts)} 个`],
              ['东西向对分带宽', formatGbps(result.bisectionGbps)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3 py-2">
                <dt className="text-gray-600">{label}</dt>
                <dd className="font-mono text-gray-900">{value}</dd>
              </div>
            ))}
          </dl>

          <ul className="space-y-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-900">
            {result.notes.map((note) => (
              <li key={note} className="flex gap-1.5">
                <span className="shrink-0">·</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
