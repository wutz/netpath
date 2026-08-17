/**
 * 网络单位换算。
 *
 * 全站口径：网络速率用 bit（Gbps），数据量用 Byte（GB/s），两者差 8 倍。
 * 线速利用率默认按 90% 折算 —— 协议头、帧间隙与前导码都要占额。
 */

/** 以太网帧的固定额外开销：前导码 7 + SFD 1 + 帧间隙 12 = 20 字节 */
export const ETH_FRAME_OVERHEAD = 20
/** 以太网最小帧长（不含上面那 20 字节） */
export const ETH_MIN_FRAME = 64
/** 经验可用线速比例 */
export const LINE_RATE_EFFICIENCY = 0.9

/** Gbps → GB/s（理论线速，未打折） */
export function gbpsToGBps(gbps: number) {
  return gbps / 8
}

/** Gbps → MB/s，按可用线速折算 */
export function gbpsToMBps(gbps: number, efficiency = LINE_RATE_EFFICIENCY) {
  return (gbps * 1000 * efficiency) / 8
}

/**
 * 线速下的理论 PPS。
 * 帧长按 L2 净荷计（不含前导码与帧间隙），额外开销单独加。
 */
export function lineRatePPS(gbps: number, frameBytes = ETH_MIN_FRAME) {
  const bitsPerFrame = (frameBytes + ETH_FRAME_OVERHEAD) * 8
  return (gbps * 1e9) / bitsPerFrame
}

/** 带宽延迟积：一条连接要跑满带宽，至少需要多大的窗口（字节） */
export function bdpBytes(gbps: number, rttMs: number) {
  return (gbps * 1e9 * (rttMs / 1000)) / 8
}

export function formatBW(mbps: number) {
  if (mbps >= 1000) return `${(mbps / 1000).toFixed(2)} GB/s`
  return `${mbps.toFixed(0)} MB/s`
}

export function formatGbps(gbps: number) {
  if (gbps >= 1000) return `${(gbps / 1000).toFixed(2)} Tbps`
  return `${gbps.toFixed(0)} Gbps`
}

export function formatPPS(pps: number) {
  if (pps >= 1e6) return `${(pps / 1e6).toFixed(2)} Mpps`
  if (pps >= 1e3) return `${(pps / 1e3).toFixed(1)} Kpps`
  return `${pps.toFixed(0)} pps`
}

export function formatBytes(bytes: number) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GiB`
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(2)} MiB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KiB`
  return `${bytes.toFixed(0)} B`
}

export function formatNumber(value: number) {
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

/** 把 a:b 形式的收敛比化简成便于阅读的样子 */
export function formatRatio(ratio: number) {
  if (ratio <= 1.0001) return `1:${(1 / ratio).toFixed(ratio === 1 ? 0 : 2)}`
  return `${ratio.toFixed(ratio >= 10 ? 0 : 2)}:1`
}
