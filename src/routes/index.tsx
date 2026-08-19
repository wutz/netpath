import { useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import {
  DEPTH_LABEL,
  DEPTH_STYLE,
  ROLE_PATHS,
  allLessons,
  getDepth,
  getRolePath,
  groupedLessons,
  lessonKey,
  stats,
  tracks,
} from '#/lib/curriculum'
import { useProgress } from '#/lib/progress'

export const Route = createFileRoute('/')({
  component: Home,
})

/** 按目标选起点 —— 给不想按岗位路线走、只想切进某个主题的人 */
const ENTRIES = [
  {
    label: '补网络基础',
    desc: '看得懂计数器，能把丢包定位到某一层',
    trackId: 'l0-basics',
    lessonId: 'metrics-units',
  },
  {
    label: '解决隧道与代理',
    desc: 'SSH 转发、WireGuard、分流规则 —— 门槛最低，最快用上',
    trackId: 'l5-tunnel',
    lessonId: 'proxy-basics',
  },
  {
    label: '做 K8s 平台',
    desc: 'Pod 怎么通、Service 的 VIP 谁在翻译',
    trackId: 'l1-k8s',
    lessonId: 'k8s-model',
  },
  {
    label: '做 AI / GPU 集群',
    desc: 'PCIe、NVLink、RDMA 与 NCCL 的带宽账',
    trackId: 'l2-hpc',
    lessonId: 'pcie-topology',
  },
  {
    label: '出规划方案',
    desc: '算端口数、交换机台数与线缆数',
    trackId: 'l3-planning',
    lessonId: 'ethernet-plan',
  },
]

/**
 * 岗位路线：按岗位裁剪出的三条主线。
 *
 * 54 节课平铺出来没人知道从哪下手，而"新手"这个身份又太笼统 ——
 * 架构师要的是算账与选型，运维要的是排障手感，必修课重叠不到一半。
 * 所以这里让人先选岗位，再看被裁剪过的清单。
 */
function RolePaths({ doneSet }: { doneSet: Set<string> }) {
  const [roleId, setRoleId] = useState(ROLE_PATHS[0].id)
  const path = getRolePath(roleId)
  if (!path) return null

  const done = path.items.filter((item) => doneSet.has(item.key)).length
  const percent = path.lessonCount > 0 ? Math.round((done / path.lessonCount) * 100) : 0

  return (
    <section className="rounded-2xl border border-brand-200 bg-brand-50/60 px-5 py-5 sm:px-6">
      <h2 className="text-xl font-bold">选一条岗位路线</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
        54 节课不必都学。选一个和你当前岗位最近的身份，下面会给出裁剪过的清单 ——
        只留这个岗位真正会用到的课，并切成几段推进。
      </p>

      {/* 手机上两列排不下三个岗位名，直接横向滚动 */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {ROLE_PATHS.map((role) => {
          const active = role.id === roleId
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => setRoleId(role.id)}
              className={`shrink-0 rounded-xl border px-3.5 py-2 text-left transition ${
                active
                  ? 'border-brand-500 bg-white shadow-sm'
                  : 'border-transparent bg-white/50 hover:bg-white/80'
              }`}
            >
              <div
                className={`text-sm font-semibold ${active ? 'text-brand-700' : 'text-gray-700'}`}
              >
                {role.title}
              </div>
              <div className="mt-0.5 text-[11px] text-gray-500">{role.alias}</div>
            </button>
          )
        })}
      </div>

      <div className="mt-4 rounded-xl bg-white/70 px-4 py-3.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-sm font-semibold text-gray-900">{path.role.tagline}</span>
          <span className="text-xs text-gray-500">
            {path.lessonCount} 节 · 约 {Math.round(path.minutes / 60)} 小时 · 已完成 {done}/
            {path.lessonCount}
          </span>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{path.role.desc}</p>
        <ul className="mt-2.5 space-y-1">
          {path.role.outcome.map((line) => (
            <li key={line} className="flex gap-2 text-xs leading-relaxed text-gray-600">
              <span className="text-brand-500">✓</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-brand-500 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {path.stages.map(({ stage, items, minutes }) => (
          <div key={stage.title}>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <h3 className="text-sm font-semibold text-gray-900">{stage.title}</h3>
              <span className="text-[11px] text-gray-400">
                {items.length} 节 · {minutes} 分钟
              </span>
            </div>
            <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{stage.hint}</p>

            <ol className="mt-2 space-y-1">
              {items.map((item) => {
                const isDone = doneSet.has(item.key)
                const depth = getDepth(item.track.id, item.lesson.id)
                return (
                  <li key={item.key}>
                    <Link
                      to="/learn/$trackId/$lessonId"
                      params={{ trackId: item.track.id, lessonId: item.lesson.id }}
                      className="flex items-center gap-2.5 rounded-lg bg-white/70 px-3 py-2 transition hover:bg-white"
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium ${
                          isDone ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {isDone ? '✓' : item.index}
                      </span>
                      <span
                        className={`shrink-0 rounded px-1 py-0.5 text-[10px] ${item.track.accent.bg} ${item.track.accent.text}`}
                      >
                        {item.track.level}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-gray-800">
                        {item.lesson.title}
                      </span>
                      {depth !== 'core' && (
                        <span
                          className={`hidden shrink-0 rounded px-1.5 py-0.5 text-[10px] sm:inline ${DEPTH_STYLE[depth]}`}
                        >
                          {DEPTH_LABEL[depth]}
                        </span>
                      )}
                      <span className="shrink-0 text-[11px] text-gray-400">
                        {item.lesson.minutes} 分
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ol>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-gray-500">
        三条线都从 L0 起步，之后分叉。跨岗位的课没被删掉，只是没排进这条线 ——
        需要时从下面的目录直接进去，课程页会提示要先补哪几节。
      </p>
    </section>
  )
}

function Home() {
  const progress = useProgress()
  const doneSet = new Set(progress.done)

  const doneCount = allLessons.filter(({ track, lesson }) =>
    doneSet.has(lessonKey(track.id, lesson.id)),
  ).length
  const percent = Math.round((doneCount / stats.lessonCount) * 100)

  const nextUp =
    allLessons.find(
      ({ track, lesson }) =>
        lesson.status === 'ready' && !doneSet.has(lessonKey(track.id, lesson.id)),
    ) ?? allLessons[0]

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-gray-200 bg-white px-5 py-7 shadow-sm sm:px-10 sm:py-10">
        <p className="text-xs font-semibold tracking-widest text-brand-600">
          系统与集群网络成长路径
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          从一个包走过的每一跳，到一整套 GPU 集群的布线账
        </h1>
        <p className="mt-4 max-w-3xl leading-relaxed text-gray-600">
          先把 Linux 协议栈上的收发路径走通，紧接着拿下代理与隧道这套立刻能用的工具箱，
          再拆开 K8s 容器网络那些看似魔法的机制，然后进入 PCIe / NVLink 与 InfiniBand / RoCE
          的高性能战场，最后学会把业务需求翻译成端口数与线缆数。每个阶段再拆成几个小组，
          组内按依赖顺序排列。
        </p>

        {/* 手机上排成 2×2，避免最后一格单独掉一行 */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:gap-4">
          {[
            ['学习阶段', `${stats.trackCount} 个`],
            ['课程', `${stats.lessonCount} 节`],
            ['已有正文', `${stats.readyCount} 节`],
            ['预计学时', `${Math.round(stats.totalMinutes / 60)} 小时`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-gray-50 px-4 py-2.5">
              <div className="text-lg font-bold text-gray-900">{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          ))}
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-4">
          <Link
            to="/learn/$trackId/$lessonId"
            params={{ trackId: nextUp.track.id, lessonId: nextUp.lesson.id }}
            className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
          >
            {doneCount > 0 ? '继续学习' : '从第一课开始'} · {nextUp.lesson.title}
          </Link>
          <div className="min-w-48 flex-1">
            <div className="mb-1 flex justify-between text-xs text-gray-500">
              <span>总进度</span>
              <span>
                {doneCount} / {stats.lessonCount}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-brand-500 transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <RolePaths doneSet={doneSet} />

      <section>
        <h2 className="text-xl font-bold">按目标选起点</h2>
        <p className="mt-1 text-sm text-gray-500">
          不想按岗位路线走，只想解决眼前那件事，就从这里切进去。
          课程页会提示这一节需要先补哪几节。
        </p>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {ENTRIES.map((entry) => {
            const track = tracks.find((t) => t.id === entry.trackId)
            if (!track) return null
            return (
              <Link
                key={entry.label}
                to="/learn/$trackId/$lessonId"
                params={{ trackId: entry.trackId, lessonId: entry.lessonId }}
                className={`rounded-xl border bg-white px-4 py-3 shadow-sm transition hover:shadow ${track.accent.border}`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${track.accent.bg} ${track.accent.text}`}
                  >
                    {track.level}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">{entry.label}</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">{entry.desc}</p>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="text-xl font-bold">学习路径</h2>
          <span className="text-sm text-gray-500">
            每个阶段按小组推进，点小组名进去看具体课程
          </span>
        </div>

        {tracks.map((track) => {
          const groups = groupedLessons(track)
          const lessonCount = groups.reduce((sum, g) => sum + g.lessons.length, 0)
          const trackDone = groups.reduce(
            (sum, g) =>
              sum + g.lessons.filter((l) => doneSet.has(lessonKey(track.id, l.id))).length,
            0,
          )

          return (
            <article
              key={track.id}
              className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${track.accent.border}`}
            >
              <header className={`flex flex-wrap items-start gap-4 px-5 py-4 ${track.accent.bg}`}>
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-bold shadow-sm ${track.accent.text}`}
                >
                  {track.level}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <Link
                      to="/tracks/$trackId"
                      params={{ trackId: track.id }}
                      className="text-lg font-bold hover:underline"
                    >
                      {track.title}
                    </Link>
                    <span className="text-xs text-gray-500">{track.subtitle}</span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">{track.goal}</p>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <div className={`text-lg font-bold ${track.accent.text}`}>
                    {trackDone}/{lessonCount}
                  </div>
                  已完成
                </div>
              </header>

              <ol className="divide-y divide-gray-100">
                {groups.map(({ group, lessons, minutes, readyCount }, groupIndex) => {
                  const groupDone = lessons.filter((l) =>
                    doneSet.has(lessonKey(track.id, l.id)),
                  ).length
                  const allDone = groupDone === lessons.length && lessons.length > 0

                  return (
                    <li key={group.id}>
                      <Link
                        to="/tracks/$trackId"
                        params={{ trackId: track.id }}
                        hash={group.id}
                        className="flex items-start gap-3 px-5 py-3 transition hover:bg-gray-50"
                      >
                        <span
                          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium ${
                            allDone ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {allDone ? '✓' : groupIndex + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                            <span className="text-sm font-semibold text-gray-900">
                              {group.title}
                            </span>
                            <span className="text-[11px] text-gray-400">
                              {lessons.length} 节 · {minutes} 分钟
                              {readyCount < lessons.length && ` · 正文 ${readyCount}/${lessons.length}`}
                            </span>
                          </span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-gray-500">
                            {group.hint}
                          </span>
                        </span>
                        <span className="mt-0.5 shrink-0 text-xs text-gray-400">
                          {groupDone > 0 && !allDone && `${groupDone}/${lessons.length}`}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ol>
            </article>
          )
        })}
      </section>
    </div>
  )
}
