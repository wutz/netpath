import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  NIC_PRESETS,
  SUPERPOD_H200_TABLE,
  planFabric,
  type FabricPlanInput,
} from '#/lib/fabric-plan'
import { formatGbps, formatNumber } from '#/lib/netunits'

const DEFAULTS: FabricPlanInput = {
  nodes: 31,
  gpusPerNode: 8,
  nicsPerNode: 8,
  portGbps: 400,
  switchPorts: 64,
  nodesPerSU: 32,
  reserveUFM: true,
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

/** 高性能计算网（rail-optimized 两层 Fat-Tree）规划计算器 */
export function FabricPlanner() {
  const [input, setInput] = useState<FabricPlanInput>(DEFAULTS)
  const result = planFabric(input)

  const set = <K extends keyof FabricPlanInput>(key: K, value: FabricPlanInput[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }))

  const num = (key: keyof FabricPlanInput, min = 1) => ({
    type: 'number' as const,
    min,
    value: input[key] as number,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      set(key, Math.max(min, Number(e.target.value) || min) as never),
    className: inputCls,
  })

  // 与参考架构对答案：节点数命中某一行时高亮，方便验证计算器口径
  const raRow = SUPERPOD_H200_TABLE.find((row) => row.nodes === input.nodes)
  const raMatch =
    raRow &&
    input.nicsPerNode === 8 &&
    input.switchPorts === 64 &&
    raRow.leaf === result.leafCount &&
    raRow.spine === result.spineCount &&
    raRow.spineLeafCables === result.spineLeafCables &&
    raRow.computeCables === result.computeCables

  return (
    <section className="my-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <header className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="rounded bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
            计算器
          </span>
          <span className="text-sm font-medium text-gray-700">计算网 Rail-Optimized 布线账</span>
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
          <Field label="网络与交换机预设">
            <select
              value={NIC_PRESETS.findIndex(
                (p) => p.portGbps === input.portGbps && p.switchPorts === input.switchPorts,
              )}
              onChange={(e) => {
                const preset = NIC_PRESETS[Number(e.target.value)]
                if (!preset) return
                setInput((prev) => ({
                  ...prev,
                  portGbps: preset.portGbps,
                  switchPorts: preset.switchPorts,
                }))
              }}
              className={inputCls}
            >
              <option value={-1}>自定义</option>
              {NIC_PRESETS.map((preset, index) => (
                <option key={preset.label} value={index}>
                  {preset.label}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="计算节点台数">
              <input {...num('nodes')} />
            </Field>
            <Field label="每节点 GPU 数">
              <input {...num('gpusPerNode')} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="每节点计算网卡数" hint="等于 rail 数，通常与 GPU 数 1:1">
              <input {...num('nicsPerNode')} />
            </Field>
            <Field label="单口速率 Gbps">
              <input {...num('portGbps')} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="交换机端口数" hint="QM9700 为 64">
              <input {...num('switchPorts', 2)} />
            </Field>
            <Field label="每 SU 节点数" hint="参考架构为 32">
              <input {...num('nodesPerSU')} />
            </Field>
          </div>

          <label className="flex items-center gap-2 pt-1 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={input.reserveUFM}
              onChange={(e) => set('reserveUFM', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            预留 UFM 管理链路（IB 场景）
          </label>

          <div className="rounded-xl border border-gray-200 px-3 py-2.5 text-xs text-gray-600">
            <div className="font-semibold text-gray-700">无阻塞算法</div>
            <p className="mt-1 leading-relaxed">
              {input.switchPorts} 口交换机对半分：{Math.floor(input.switchPorts / 2)} 口下行接节点、
              {Math.floor(input.switchPorts / 2)} 口上行接 spine。每个 rail 独立成组，
              所以 leaf 台数 = rail 数 × 每 rail 的 leaf 数。
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-rose-50 px-2 py-3 text-center">
              <div className="text-[11px] font-medium text-rose-700">GPU 总数</div>
              <div className="mt-1 text-xl font-bold text-rose-900">{formatNumber(result.gpus)}</div>
            </div>
            <div className="rounded-xl bg-brand-50 px-2 py-3 text-center">
              <div className="text-[11px] font-medium text-brand-700">leaf</div>
              <div className="mt-1 text-xl font-bold text-brand-900">{result.leafCount}</div>
            </div>
            <div className="rounded-xl bg-violet-50 px-2 py-3 text-center">
              <div className="text-[11px] font-medium text-violet-700">spine</div>
              <div className="mt-1 text-xl font-bold text-violet-900">{result.spineCount}</div>
            </div>
          </div>

          <dl className="divide-y divide-gray-100 rounded-xl border border-gray-200 px-3 text-sm">
            {[
              ['rail 数', `${result.rails} 个`],
              ['每 rail 的 leaf 数', `${result.leavesPerRail} 台（每台接 ${result.nodesPerLeaf} 节点）`],
              ['leaf↔spine 并行链路', `${result.linksPerSpinePerLeaf} 条/对`],
              ['计算网线缆', `${formatNumber(result.computeCables)} 根`],
              ['spine-leaf 线缆', `${formatNumber(result.spineLeafCables)} 根`],
              ['SU 数量', `${result.suCount} 个`],
              ['单节点计算网带宽', formatGbps(result.nodeGbps)],
              ['单节点理论 busbw 上限', `${result.nodeBusbwGBps.toFixed(0)} GB/s`],
              ['全网对分带宽', formatGbps(result.bisectionGbps)],
              ['通信跳数', `同 rail ${result.hops.sameRail} 跳 ／ 跨 rail ${result.hops.crossRail} 跳`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3 py-2">
                <dt className="shrink-0 text-gray-500">{label}</dt>
                <dd className="text-right font-mono text-gray-800">{value}</dd>
              </div>
            ))}
          </dl>

          {raRow && (
            <div
              className={`rounded-xl px-3 py-2.5 text-xs ${
                raMatch ? 'bg-emerald-50 text-emerald-900' : 'bg-gray-50 text-gray-700'
              }`}
            >
              <div className="font-semibold">
                {raMatch ? '✓ 与 SuperPOD 参考架构一致' : '与 SuperPOD 参考架构对比'}
              </div>
              <p className="mt-1 leading-relaxed">
                {raRow.su} 个 SU / {raRow.nodes} 节点 / {formatNumber(raRow.gpus)} GPU 时，RA 给出{' '}
                {raRow.leaf} 台 leaf + {raRow.spine} 台 spine、
                {formatNumber(raRow.computeCables)} 根计算线缆、
                {formatNumber(raRow.spineLeafCables)} 根 spine-leaf 线缆。
              </p>
            </div>
          )}

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
