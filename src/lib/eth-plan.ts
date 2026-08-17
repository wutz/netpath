/**
 * 以太网 Spine-Leaf 规划（教学口径）。
 *
 * 三笔账：
 *   接入账 —— 节点端口总数 ÷ 每台 leaf 可用下行口 = leaf 台数
 *   上行账 —— leaf 下行总带宽 ÷ leaf 上行总带宽 = 收敛比
 *   汇聚账 —— leaf 上行口总数 ÷ 每台 spine 端口数 = spine 台数
 *
 * 刻意不考虑的东西：MLAG 对端口的占用、breakout 光模块的拆分、
 * 管理网与带外网。这些在课程正文里单独讲。
 */

export interface EthPlanInput {
  /** 服务器台数 */
  nodes: number
  /** 每台服务器接入端口数（含冗余那一路） */
  portsPerNode: number
  /** 接入口速率 Gbps */
  nodePortGbps: number
  /** 每台 leaf 的总端口数 */
  leafPorts: number
  /** 每台 leaf 用作上行的端口数 */
  uplinksPerLeaf: number
  /** 上行口速率 Gbps */
  uplinkGbps: number
  /** 每台 spine 的总端口数 */
  spinePorts: number
  /** 服务器双上行到两台 leaf（leaf 台数按偶数成对） */
  dualHomed: boolean
}

export interface EthPlanResult {
  accessPorts: number
  downlinksPerLeaf: number
  leafCount: number
  spineCount: number
  spineLeafCables: number
  accessCables: number
  /** 全部 leaf 的下行口余量 */
  sparePorts: number
  /** 单台 leaf 满载时的下行带宽 Gbps */
  leafDownGbps: number
  /** 单台 leaf 的上行带宽 Gbps */
  leafUpGbps: number
  /** 收敛比，2 表示 2:1 */
  oversubscription: number
  /** spine 端口占用率 */
  spineUtil: number
  /** 集群东西向的对分带宽 Gbps */
  bisectionGbps: number
  verdict: { label: string; tone: 'good' | 'ok' | 'bad' }
  notes: string[]
}

export const LEAF_PRESETS = [
  { label: '48×25G + 6×100G（通用接入）', leafPorts: 54, uplinksPerLeaf: 6, nodePortGbps: 25, uplinkGbps: 100 },
  { label: '32×100G（存储/高带宽接入）', leafPorts: 32, uplinksPerLeaf: 8, nodePortGbps: 100, uplinkGbps: 400 },
  { label: '64×200G（GPU 节点带内网）', leafPorts: 64, uplinksPerLeaf: 16, nodePortGbps: 200, uplinkGbps: 400 },
]

function ratioVerdict(ratio: number): EthPlanResult['verdict'] {
  if (ratio <= 1.0001) return { label: '无阻塞', tone: 'good' }
  if (ratio <= 3.0001) return { label: '可接受', tone: 'ok' }
  return { label: '收敛过重', tone: 'bad' }
}

export function planEthernet(input: EthPlanInput): EthPlanResult {
  const accessPorts = input.nodes * input.portsPerNode
  const downlinksPerLeaf = Math.max(1, input.leafPorts - input.uplinksPerLeaf)

  let leafCount = Math.max(1, Math.ceil(accessPorts / downlinksPerLeaf))
  // 双上行要求每台服务器分别接到两台 leaf 上，leaf 必须成对
  if (input.dualHomed) leafCount = Math.max(2, leafCount + (leafCount % 2))

  const totalUplinks = leafCount * input.uplinksPerLeaf
  const spineCount = Math.max(1, Math.ceil(totalUplinks / input.spinePorts))

  const leafDownGbps = downlinksPerLeaf * input.nodePortGbps
  const leafUpGbps = input.uplinksPerLeaf * input.uplinkGbps
  const oversubscription = leafUpGbps > 0 ? leafDownGbps / leafUpGbps : Infinity

  const notes: string[] = []

  if (input.dualHomed) {
    notes.push(
      '双上行下每台服务器的两个端口要落在不同 leaf 上，同一对 leaf 之间还需要 peer-link 或 MLAG 域，端口预算里要再留 2 个口。',
    )
  }
  if (oversubscription > 3.0001) {
    notes.push(
      `收敛比 ${oversubscription.toFixed(1)}:1 偏重。跨 leaf 的东西向流量（分布式存储副本、AI 数据加载）会先撞上行口，加上行口或换更高速率的上行光模块比加节点更急。`,
    )
  }
  if (oversubscription < 1) {
    notes.push('上行容量超过下行容量，多花的钱买不到额外性能，可以把上行口挪去接节点。')
  }
  const spineUtil = spineCount > 0 ? totalUplinks / (spineCount * input.spinePorts) : 0
  if (spineUtil < 0.5 && spineCount > 1) {
    notes.push(
      `spine 端口只用掉 ${(spineUtil * 100).toFixed(0)}%，当前规模用更少的 spine 或更小的机型就够，剩下的端口留给下一期扩容。`,
    )
  }
  if (leafCount > input.spinePorts) {
    notes.push(
      `leaf 台数（${leafCount}）超过单台 spine 的端口数（${input.spinePorts}），两层架构接不下，需要上三层（super-spine）或改用更大端口数的 spine。`,
    )
  }
  notes.push('以上只算业务网。管理网（1G/10G 接入）与带外网（BMC）需要另外单独一套交换机和线缆。')

  return {
    accessPorts,
    downlinksPerLeaf,
    leafCount,
    spineCount,
    spineLeafCables: totalUplinks,
    accessCables: accessPorts,
    sparePorts: leafCount * downlinksPerLeaf - accessPorts,
    leafDownGbps,
    leafUpGbps,
    oversubscription,
    spineUtil,
    bisectionGbps: totalUplinks * input.uplinkGbps,
    verdict: ratioVerdict(oversubscription),
    notes,
  }
}
