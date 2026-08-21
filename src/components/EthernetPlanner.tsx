import { useState } from 'react'
import { LEAF_PRESETS, planEthernet, type EthPlanInput } from '#/lib/eth-plan'
import { formatGbps, formatNumber, formatRatio } from '#/lib/netunits'
import { Field, NoteList, Panel, Stat, inputCls } from './ui'

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

/** 结论色是有含义的（够用 / 紧 / 不够），各占一个语义色槽 */
const VERDICT_STYLE = {
  good: 'bg-info-soft/60 text-info-deep',
  ok: 'bg-warn-soft text-warn-deep',
  bad: 'bg-danger-soft text-danger-deep',
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
    <Panel eyebrow="Planner" title="以太网 Spine-Leaf 端口账" onReset={() => setInput(DEFAULTS)}>
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

          <label className="flex items-center gap-2 pt-1 text-sm text-body">
            <input
              type="checkbox"
              checked={input.dualHomed}
              onChange={(e) => set('dualHomed', e.target.checked)}
              className="h-4 w-4 shrink-0 accent-brand-600"
            />
            服务器双上行到两台 leaf（leaf 按偶数成对）
          </label>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Stat
              label="leaf 交换机"
              value={`${result.leafCount} 台`}
              size="md"
              note={`每台可下行 ${result.downlinksPerLeaf} 口`}
            />
            <Stat
              label="spine 交换机"
              value={`${result.spineCount} 台`}
              size="md"
              note={`端口用掉 ${(result.spineUtil * 100).toFixed(0)}%`}
            />
          </div>

          <div className={`rounded-md px-3 py-3 ${VERDICT_STYLE[result.verdict.tone]}`}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-medium">收敛比（下行 : 上行）</span>
              <span className="shrink-0 rounded-xs bg-canvas/70 px-1.5 py-0.5 text-[11px] font-medium">
                {result.verdict.label}
              </span>
            </div>
            <div className="mt-1 font-mono text-2xl font-semibold tracking-[-0.04em]">
              {formatRatio(result.oversubscription)}
            </div>
            <div className="mt-1 text-[11px]">
              单台 leaf 下行 {formatGbps(result.leafDownGbps)} ／ 上行{' '}
              {formatGbps(result.leafUpGbps)}
            </div>
          </div>

          <dl className="divide-y divide-line rounded-md bg-soft-2 px-3 text-sm">
            {[
              ['接入端口总数', `${formatNumber(result.accessPorts)} 个`],
              ['接入线缆', `${formatNumber(result.accessCables)} 根`],
              ['spine-leaf 线缆', `${formatNumber(result.spineLeafCables)} 根`],
              ['下行口余量', `${formatNumber(result.sparePorts)} 个`],
              ['东西向对分带宽', formatGbps(result.bisectionGbps)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3 py-2">
                <dt className="text-body">{label}</dt>
                <dd className="font-mono text-ink">{value}</dd>
              </div>
            ))}
          </dl>

          <NoteList items={result.notes} tone="warn" />
        </div>
      </div>
    </Panel>
  )
}
