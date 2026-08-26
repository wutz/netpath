/**
 * 学习进度 —— 存在浏览器 localStorage，无账号体系。
 * 用 useSyncExternalStore 保证 SSR 时返回稳定的空状态，避免水合不一致。
 */
import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'netpath:progress:v2'
const LEGACY_KEY = 'netpath:progress:v1'

/**
 * v1 → v2 的一次性迁移。
 *
 * 课程按五个新分类重切时 trackId 全变了（`l0-basics/toolbox` → `ethernet/toolbox`），
 * 不迁移的话所有人的完成记录会一夜清零。课程 id 本身基本没动，所以只需要换前缀；
 * 合并掉的几节映射到承接它的那一节，删掉的两节直接丢弃。
 */
const LEGACY_TRACK: Record<string, string> = {
  'l0-basics/first-look': 'ethernet',
  'l0-basics/metrics-units': 'ethernet',
  'l0-basics/switching-routing': 'ethernet',
  'l0-basics/packet-journey': 'ethernet',
  'l0-basics/tcp-behavior': 'ethernet',
  'l0-basics/kernel-stack': 'ethernet',
  'l0-basics/toolbox': 'ethernet',
  'l0-basics/quest-slow-host': 'ethernet',
  'l3-planning/ethernet-plan': 'ethernet',
  'l4-advanced/observability': 'ethernet',
  'l4-advanced/oncall': 'ethernet',
  'l5-tunnel/proxy-basics': 'gfw',
  'l5-tunnel/restricted-network': 'gfw',
  'l5-tunnel/clash-rules': 'gfw',
  'l5-tunnel/quest-proxy-broken': 'gfw',
  'l2-hpc/pcie-topology': 'hpc',
  'l2-hpc/nvlink': 'hpc',
  'l2-hpc/why-rdma': 'hpc',
  'l2-hpc/infiniband': 'hpc',
  'l2-hpc/roce': 'hpc',
  'l2-hpc/perftest': 'hpc',
  'l2-hpc/topology-rail': 'hpc',
  'l2-hpc/nccl': 'hpc',
  'l2-hpc/quest-slow-allreduce': 'hpc',
  'l4-advanced/mpi': 'hpc',
  'l4-advanced/gpudirect': 'hpc',
  'l4-advanced/nvme-of': 'hpc',
  'l4-advanced/dpu': 'hpc',
  'l4-advanced/dpdk': 'hpc',
  'l3-planning/requirements': 'hpc',
  'l3-planning/fabric-plan': 'hpc',
  'l3-planning/ib-vs-roce': 'hpc',
  'l1-k8s/k8s-model': 'k8s',
  'l1-k8s/netns-veth': 'k8s',
  'l1-k8s/cni': 'k8s',
  'l1-k8s/service': 'k8s',
  'l1-k8s/kube-proxy-ebpf': 'k8s',
  'l1-k8s/metallb': 'k8s',
  'l1-k8s/ingress-egress': 'k8s',
  'l1-k8s/dns-policy': 'k8s',
  'l1-k8s/secondary-cni': 'k8s',
  'l1-k8s/quest-pod-unreachable': 'k8s',
  'l2-hpc/k8s-rdma': 'k8s',
  'l4-advanced/ebpf-xdp': 'k8s',
  'l4-advanced/sriov-macvlan': 'k8s',
  'l3-planning/ip-plan': 'k8s',
}

/** 合并掉的课映射到承接它的那一节；gost 与透明网关整节删除，不映射 */
const LEGACY_MERGED: Record<string, string> = {
  'l5-tunnel/ssh-tunnels': 'access/ssh',
  'l5-tunnel/ssh-advanced': 'access/ssh',
  'l5-tunnel/wireguard': 'access/vpn',
  'l5-tunnel/tailscale': 'access/vpn',
  'l5-tunnel/pritunl': 'access/vpn',
  'l5-tunnel/traffic-shaping': 'gfw/vps-anytls',
}

/** 迁移一条 `track/lesson` 或 `track/lesson#quiz` 记录，认不出的返回 undefined */
function migrateKey(key: string): string | undefined {
  const hash = key.indexOf('#')
  const lessonKey = hash === -1 ? key : key.slice(0, hash)
  const suffix = hash === -1 ? '' : key.slice(hash)
  const merged = LEGACY_MERGED[lessonKey]
  if (merged) return merged + suffix
  const track = LEGACY_TRACK[lessonKey]
  if (!track) return undefined
  return `${track}/${lessonKey.split('/')[1]}${suffix}`
}

function migrate(old: Partial<ProgressState> | null): ProgressState {
  const pick = (list: unknown) =>
    Array.isArray(list)
      ? Array.from(new Set(list.filter((k): k is string => typeof k === 'string').map(migrateKey).filter((k): k is string => Boolean(k))))
      : []
  return { done: pick(old?.done), quiz: pick(old?.quiz) }
}

export interface ProgressState {
  /** 已完成课程，元素为 `${trackId}/${lessonId}` */
  done: string[]
  /** 已答对的检查点，元素为 `${trackId}/${lessonId}#${quizId}` */
  quiz: string[]
}

const EMPTY: ProgressState = { done: [], quiz: [] }

let cache: ProgressState | null = null
const listeners = new Set<() => void>()

function read(): ProgressState {
  if (typeof window === 'undefined') return EMPTY
  if (cache) return cache
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ProgressState>
      cache = {
        done: Array.isArray(parsed?.done) ? parsed.done : [],
        quiz: Array.isArray(parsed?.quiz) ? parsed.quiz : [],
      }
      return cache
    }
    // 没有 v2 数据，尝试从 v1 迁移一次。v1 原样保留，回滚时还能用
    const legacy = window.localStorage.getItem(LEGACY_KEY)
    cache = migrate(legacy ? (JSON.parse(legacy) as Partial<ProgressState>) : null)
    if (legacy) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
  } catch {
    cache = { done: [], quiz: [] }
  }
  return cache
}

function write(next: ProgressState) {
  cache = next
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // 隐私模式下写入失败，内存态仍然可用
    }
  }
  listeners.forEach((fn) => fn())
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useProgress(): ProgressState {
  return useSyncExternalStore(subscribe, read, () => EMPTY)
}

function toggleIn(list: string[], key: string, on: boolean) {
  const has = list.includes(key)
  if (on && !has) return [...list, key]
  if (!on && has) return list.filter((k) => k !== key)
  return list
}

export function setLessonDone(key: string, done: boolean) {
  const state = read()
  write({ ...state, done: toggleIn(state.done, key, done) })
}

export function setQuizPassed(key: string, passed: boolean) {
  const state = read()
  write({ ...state, quiz: toggleIn(state.quiz, key, passed) })
}

export function resetProgress() {
  write({ done: [], quiz: [] })
}
