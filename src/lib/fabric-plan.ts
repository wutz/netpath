/**
 * 高性能网络（计算网）规划 —— rail-optimized 两层 Fat-Tree。
 *
 * 口径对齐 NVIDIA DGX SuperPOD 参考架构，输入 31 节点 / 8 网卡 / 64 口交换机时
 * 应当算出 8 台 leaf + 4 台 spine + 256 根 spine-leaf 线缆，与 RA 的 Table 4 一致。
 *
 * 几条约束：
 *   1. rail 数 = 每节点计算网卡数，每个 rail 有自己独立的一组 leaf
 *   2. 无阻塞要求 leaf 上下行对半分：R 口交换机拿 R/2 做下行、R/2 做上行
 *   3. 每台 leaf 的上行必须均分到各台 spine，所以 spine 台数得能整除 R/2
 */

export interface FabricPlanInput {
  /** 计算节点台数 */
  nodes: number
  /** 每节点 GPU 数 */
  gpusPerNode: number
  /** 每节点计算网卡数 = rail 数 */
  nicsPerNode: number
  /** 单口速率 Gbps */
  portGbps: number
  /** 交换机端口数（radix） */
  switchPorts: number
  /** 一个 SU（scalable unit）里的节点数 */
  nodesPerSU: number
  /** 是否为管理平面预留线缆（IB 下的 UFM） */
  reserveUFM: boolean
}

export interface FabricPlanResult {
  gpus: number
  rails: number
  /** 每个 rail 里一台 leaf 能接多少节点 */
  nodesPerLeaf: number
  /** 每个 rail 需要的 leaf 台数 */
  leavesPerRail: number
  leafCount: number
  spineCount: number
  /** 每台 leaf 到每台 spine 的并行链路数 */
  linksPerSpinePerLeaf: number
  computeCables: number
  spineLeafCables: number
  suCount: number
  /** 单节点计算网带宽 Gbps */
  nodeGbps: number
  /** 单节点理论 busbw 上限 GB/s */
  nodeBusbwGBps: number
  /** 全集群对分带宽 Gbps */
  bisectionGbps: number
  nonBlocking: boolean
  /** 同 rail 通信跳数 / 跨 rail 通信跳数 */
  hops: { sameRail: number; crossRail: number }
  notes: string[]
}

export const NIC_PRESETS = [
  { label: 'NDR InfiniBand 400G（H200 / B200 计算网）', portGbps: 400, switchPorts: 64 },
  { label: 'XDR InfiniBand 800G', portGbps: 800, switchPorts: 64 },
  { label: 'HDR InfiniBand 200G（A100 计算网）', portGbps: 200, switchPorts: 40 },
  { label: 'RoCE 400G 以太网（Spectrum-4 51.2T）', portGbps: 400, switchPorts: 64 },
]

/** 找出能整除 base、且不小于 min 的最小值 */
function smallestDivisorAtLeast(base: number, min: number) {
  for (let i = min; i <= base; i++) {
    if (base % i === 0) return i
  }
  return base
}

export function planFabric(input: FabricPlanInput): FabricPlanResult {
  const rails = Math.max(1, input.nicsPerNode)
  const half = Math.max(1, Math.floor(input.switchPorts / 2))

  // 无阻塞：一台 leaf 最多接 R/2 个节点（每个节点在本 rail 上占 1 口）
  const nodesPerLeaf = half
  const leavesPerRail = Math.max(1, Math.ceil(input.nodes / nodesPerLeaf))
  const leafCount = leavesPerRail * rails

  const totalUplinks = leafCount * half
  const spineMin = Math.max(1, Math.ceil(totalUplinks / input.switchPorts))
  // 上行要均分到每台 spine，spine 台数必须整除每台 leaf 的上行口数
  const spineCount = smallestDivisorAtLeast(half, spineMin)
  const linksPerSpinePerLeaf = Math.floor(half / spineCount)

  const computeCables = input.nodes * rails + (input.reserveUFM ? 4 : 0)
  const nodeGbps = rails * input.portGbps

  const notes: string[] = []
  const nonBlocking = spineCount * input.switchPorts >= totalUplinks

  if (spineMin > half) {
    notes.push(
      `这个规模两层 Fat-Tree 已经接不下（需要 ${spineMin} 台 spine，但每台 leaf 只有 ${half} 个上行口）。要加一层 super-spine，跨 rail 通信会变成 5 跳。`,
    )
  }
  if (input.nodes % input.nodesPerSU !== 0) {
    const suCount = Math.ceil(input.nodes / input.nodesPerSU)
    notes.push(
      `节点数不是 SU（${input.nodesPerSU} 台）的整数倍，当前算成 ${suCount} 个 SU。参考架构的建议是按整 SU 布线、空位留着不插机器 —— 这样各处的转发路径长度一致，性能不会因为机器插在哪台 leaf 上而变化。`,
    )
  }
  if (spineCount > spineMin) {
    notes.push(
      `按容量只要 ${spineMin} 台 spine，但每台 leaf 的 ${half} 个上行口要均分，spine 台数得能整除 ${half}，所以取 ${spineCount} 台。此时每台 leaf 到每台 spine 之间是 ${linksPerSpinePerLeaf} 条并行链路。`,
    )
  }
  if (input.reserveUFM) {
    notes.push('已按 IB 场景预留 4 根 UFM 管理链路；这也是参考架构里一个 SU 明明是 32 台机位、却只装 31 台节点的原因。')
  }
  notes.push(
    'rail-optimized 的关键是「同一个 rail 的网卡接到同一组 leaf 上」。接错成「一台机器的 8 张卡全接一台 leaf」时端口数一样、账也算得通，但同 rail 的集合通信会全部挤到 spine 上，AllReduce 带宽直接腰斩。',
  )
  notes.push('存储网、带内管理网、带外管理网都要另算。参考架构里它们分别是独立的 IB 网、SN4600 以太网和 SN2201 以太网。')

  return {
    gpus: input.nodes * input.gpusPerNode,
    rails,
    nodesPerLeaf,
    leavesPerRail,
    leafCount,
    spineCount,
    linksPerSpinePerLeaf,
    computeCables,
    spineLeafCables: totalUplinks,
    suCount: Math.ceil(input.nodes / Math.max(1, input.nodesPerSU)),
    nodeGbps,
    nodeBusbwGBps: nodeGbps / 8,
    bisectionGbps: totalUplinks * input.portGbps,
    nonBlocking,
    hops: { sameRail: 1, crossRail: 3 },
    notes,
  }
}

/** DGX SuperPOD (H200) 参考架构 Table 4，用来给计算器对答案 */
export const SUPERPOD_H200_TABLE = [
  { su: 1, nodes: 31, gpus: 248, leaf: 8, spine: 4, computeCables: 252, spineLeafCables: 256 },
  { su: 2, nodes: 63, gpus: 504, leaf: 16, spine: 8, computeCables: 508, spineLeafCables: 512 },
  { su: 3, nodes: 95, gpus: 760, leaf: 24, spine: 16, computeCables: 764, spineLeafCables: 768 },
  { su: 4, nodes: 127, gpus: 1016, leaf: 32, spine: 16, computeCables: 1020, spineLeafCables: 1024 },
]
