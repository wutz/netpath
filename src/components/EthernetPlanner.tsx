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

const inputCls =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-gray-400">{hint}</span>}
    </label>
  )
}

const VERDICT_STYLE = {
  good: 'bg-emerald-50 text-emerald-800',
  ok: 'bg-amber-50 text-amber-800',
  bad: 'bg-rose-50 text-rose-800',
} as const

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
    <section className="my-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <header className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="rounded bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
            计算器
          </span>
          <span className="text-sm font-medium text-gray-700">以太网 Spine-Leaf 端口账</span>
        </div>
        <button
          type="button"
          onClick={() => setInput(DEFAULTS)}
          className="text-xs text-gray-400 transition hover:text-gray-700"
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
              className="h-4 w-4 rounded border-gray-300"
            />
            服务器双上行到两台 leaf（leaf 按偶数成对）
          </label>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-brand-50 px-3 py-3 text-center">
              <div className="text-xs font-medium text-brand-700">leaf 交换机</div>
              <div className="mt-1 text-2xl font-bold text-brand-900">{result.leafCount} 台</div>
              <div className="mt-0.5 text-[11px] text-brand-700">
                每台可下行 {result.downlinksPerLeaf} 口
              </div>
            </div>
            <div className="rounded-xl bg-violet-50 px-3 py-3 text-center">
              <div className="text-xs font-medium text-violet-700">spine 交换机</div>
              <div className="mt-1 text-2xl font-bold text-violet-900">{result.spineCount} 台</div>
              <div className="mt-0.5 text-[11px] text-violet-700">
                端口用掉 {(result.spineUtil * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          <div className={`rounded-xl px-3 py-3 ${VERDICT_STYLE[result.verdict.tone]}`}>
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-medium">收敛比（下行 : 上行）</span>
              <span className="rounded bg-white/60 px-1.5 py-0.5 text-[11px] font-semibold">
                {result.verdict.label}
              </span>
            </div>
            <div className="mt-1 text-2xl font-bold">
              {formatRatio(result.oversubscription)}
            </div>
            <div className="mt-1 text-[11px]">
              单台 leaf 下行 {formatGbps(result.leafDownGbps)} ／ 上行{' '}
              {formatGbps(result.leafUpGbps)}
            </div>
          </div>

          <dl className="divide-y divide-gray-100 rounded-xl border border-gray-200 px-3 text-sm">
            {[
              ['接入端口总数', `${formatNumber(result.accessPorts)} 个`],
              ['接入线缆', `${formatNumber(result.accessCables)} 根`],
              ['spine-leaf 线缆', `${formatNumber(result.spineLeafCables)} 根`],
              ['下行口余量', `${formatNumber(result.sparePorts)} 个`],
              ['东西向对分带宽', formatGbps(result.bisectionGbps)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-2">
                <dt className="text-gray-500">{label}</dt>
                <dd className="font-mono text-gray-800">{value}</dd>
              </div>
            ))}
          </dl>

          <ul className="space-y-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
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
