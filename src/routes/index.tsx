import { type ReactNode, useState } from 'react'
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

/**
 * 首页从选岗位直接开始 —— 原来顶上那张标题卡只是重复了站点名和阶段介绍，
 * 占掉手机上大半屏，现在去掉，路线区自己就是页面标题。
 *
 * 标签是四个岗位。原来「岗位路线 / 按目标选起点 / 学习路径」三块讲的是同一件事的三种切法，
 * 堆在一页上反而看不出该从哪起手，所以合并成一处 —— 选一个岗位，这里就有它的说明、
 * 进度、继续按钮和课程清单。全部 54 节的阶段目录折叠在最底下，需要时再展开。
 */
function Home() {
  const progress = useProgress()
  const doneSet = new Set(progress.done)
  const doneCount = allLessons.filter(({ track, lesson }) =>
    doneSet.has(lessonKey(track.id, lesson.id)),
  ).length

  return <Paths doneSet={doneSet} doneCount={doneCount} />
}

function Paths({ doneSet, doneCount }: { doneSet: Set<string>; doneCount: number }) {
  const [tabId, setTabId] = useState(ROLE_PATHS[0].id)

  return (
    <section className="rounded-2xl border border-brand-200 bg-brand-50/60 px-5 py-5 sm:px-6">
      <h1 className="text-xl font-bold">选一条岗位路线</h1>
      <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
        {stats.lessonCount} 节课不必都学。挑一个和你当前岗位最近的身份，
        下面会给出裁剪过的清单 —— 只留这个岗位真正会用到的课，并切成几段推进。
      </p>

      {/* 手机上四个标签排不下，直接横向滚动 */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {ROLE_PATHS.map((role) => {
          const active = role.id === tabId
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => setTabId(role.id)}
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

      <RolePanel roleId={tabId} doneSet={doneSet} />
      <Catalog doneSet={doneSet} doneCount={doneCount} />
    </section>
  )
}

/** 标签里那张说明卡：一句处境、一段说明、几条要点，外加进度与继续按钮 */
function PanelHead({
  tagline,
  desc,
  bullets,
  meta,
  percent,
  cta,
}: {
  tagline: string
  desc: string
  bullets: string[]
  meta: string
  percent: number
  cta: ReactNode
}) {
  return (
    <div className="mt-4 rounded-xl bg-white/70 px-4 py-3.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-gray-900">{tagline}</span>
        <span className="text-xs text-gray-500">{meta}</span>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{desc}</p>
      <ul className="mt-2.5 space-y-1">
        {bullets.map((line) => (
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
      {cta}
    </div>
  )
}

const ctaClass =
  'mt-3 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700'

/** 一条岗位路线：说明卡 + 按段落分组的课程清单 */
function RolePanel({ roleId, doneSet }: { roleId: string; doneSet: Set<string> }) {
  const path = getRolePath(roleId)
  if (!path) return null

  const done = path.items.filter((item) => doneSet.has(item.key)).length
  const percent = path.lessonCount > 0 ? Math.round((done / path.lessonCount) * 100) : 0
  /** 沿这条线往下走的第一节没学完的课 */
  const resume = path.items.find((item) => !doneSet.has(item.key)) ?? path.items[0]

  return (
    <>
      <PanelHead
        tagline={path.role.tagline}
        desc={path.role.desc}
        bullets={path.role.outcome}
        meta={`${path.lessonCount} 节 · 约 ${Math.round(path.minutes / 60)} 小时 · 已完成 ${done}/${path.lessonCount}`}
        percent={percent}
        cta={
          resume && (
            <Link
              to="/learn/$trackId/$lessonId"
              params={{ trackId: resume.track.id, lessonId: resume.lesson.id }}
              search={{ role: roleId }}
              className={ctaClass}
            >
              {done > 0 ? '继续这条路线' : '沿这条路线开始'} · 第 {resume.index} 节{' '}
              {resume.lesson.title}
            </Link>
          )
        }
      />

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
                      search={{ role: roleId }}
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
        四条岗位路线都从 L0 起步，之后分叉。没排进这条线的课不会消失 ——
        展开下面的全部课程就能直接进去，课程页会提示要先补哪几节。
      </p>
    </>
  )
}

/**
 * 全部课程：六个阶段，每个阶段按小组展开。
 *
 * 岗位路线是裁剪，这里才是全集 —— 也是 /tracks 各阶段页的入口，所以不能省掉。
 * 但它比路线长得多，默认折叠，只留一行「已完成 N/54」在外面。
 */
function Catalog({ doneSet, doneCount }: { doneSet: Set<string>; doneCount: number }) {
  const [open, setOpen] = useState(false)
  const percent = Math.round((doneCount / stats.lessonCount) * 100)
  // 跳过还没写正文的课，别把人送到大纲占位页上
  const resume =
    allLessons.find(
      ({ track, lesson }) =>
        lesson.status === 'ready' && !doneSet.has(lessonKey(track.id, lesson.id)),
    ) ?? allLessons[0]

  return (
    <div className="mt-4 rounded-xl bg-white/70 px-4 py-3.5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-baseline gap-2 text-left"
      >
        <span className="text-sm font-semibold text-gray-900">全部课程</span>
        <span className="text-xs text-gray-500">
          {stats.trackCount} 个阶段 · {stats.lessonCount} 节 · 约{' '}
          {Math.round(stats.totalMinutes / 60)} 小时 · 已完成 {doneCount}/{stats.lessonCount}
        </span>
        <span className="ml-auto shrink-0 text-xs text-brand-600">{open ? '收起' : '展开'}</span>
      </button>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-brand-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      {!open && (
        <p className="mt-2.5 text-xs leading-relaxed text-gray-500">
          不挑岗位、想按阶段通读，或者只想直接切进某个主题，就从这里进去。
          顺序是 L0 → T → L1 → L2 → L3 → L4。
        </p>
      )}

      {open && (
        <>
          <Link
            to="/learn/$trackId/$lessonId"
            params={{ trackId: resume.track.id, lessonId: resume.lesson.id }}
            className={ctaClass}
          >
            {doneCount > 0 ? '继续学习' : '从第一课开始'} · {resume.lesson.title}
          </Link>

          <div className="mt-4 space-y-3">
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
                  className={`overflow-hidden rounded-xl border bg-white ${track.accent.border}`}
                >
                  <header className={`flex items-start gap-3 px-4 py-3 ${track.accent.bg}`}>
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-bold shadow-sm ${track.accent.text}`}
                    >
                      {track.level}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <Link
                          to="/tracks/$trackId"
                          params={{ trackId: track.id }}
                          className="font-bold hover:underline"
                        >
                          {track.title}
                        </Link>
                        <span className="text-[11px] text-gray-500">{track.subtitle}</span>
                      </div>
                      <p className="mt-0.5 text-xs leading-relaxed text-gray-600">{track.goal}</p>
                    </div>
                    <div className={`shrink-0 text-sm font-bold ${track.accent.text}`}>
                      {trackDone}/{lessonCount}
                    </div>
                  </header>

                  <ol className="divide-y divide-gray-100">
                    {groups.map(({ group, lessons, minutes }, groupIndex) => {
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
                            className="flex items-start gap-2.5 px-4 py-2.5 transition hover:bg-gray-50"
                          >
                            <span
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium ${
                                allDone ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {allDone ? '✓' : groupIndex + 1}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-baseline gap-x-2">
                                <span className="text-sm font-semibold text-gray-900">
                                  {group.title}
                                </span>
                                <span className="text-[11px] text-gray-400">
                                  {lessons.length} 节 · {minutes} 分钟
                                </span>
                              </span>
                              <span className="mt-0.5 block text-xs leading-relaxed text-gray-500">
                                {group.hint}
                              </span>
                            </span>
                            <span className="mt-0.5 shrink-0 text-[11px] text-gray-400">
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
          </div>
        </>
      )}
    </div>
  )
}
