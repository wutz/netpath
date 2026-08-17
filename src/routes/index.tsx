import { Link, createFileRoute } from '@tanstack/react-router'
import { allLessons, groupedLessons, lessonKey, stats, tracks } from '#/lib/curriculum'
import { useProgress } from '#/lib/progress'

export const Route = createFileRoute('/')({
  component: Home,
})

/** 按目标选起点 —— 53 节课不该让人从第一节硬啃到最后 */
const ENTRIES = [
  {
    label: '补网络基础',
    desc: '看得懂计数器，能把丢包定位到某一层',
    trackId: 'l0-basics',
    lessonId: 'metrics-units',
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
  {
    label: '解决隧道与代理',
    desc: 'SSH 转发、WireGuard、分流规则',
    trackId: 'l5-tunnel',
    lessonId: 'proxy-basics',
  },
]

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
          六个阶段，每个阶段再拆成几个小组，按依赖顺序往前走：先把 Linux 协议栈上的收发路径走通，
          再拆开 K8s 容器网络那些看似魔法的机制，接着进入 PCIe / NVLink 与 InfiniBand / RoCE
          的高性能战场，然后学会把业务需求翻译成端口数与线缆数。代理与隧道那一阶段可以随时独立来学。
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

      <section>
        <h2 className="text-xl font-bold">按目标选起点</h2>
        <p className="mt-1 text-sm text-gray-500">
          不必从第一节按顺序啃到最后。挑一个和当前工作最近的入口进去，
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
