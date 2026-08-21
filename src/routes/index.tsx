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

/** 墨黑主按钮 —— DESIGN.md 里「动作」只有这一个颜色 */
const ctaClass =
  'mt-4 inline-flex items-center gap-1.5 rounded-md bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-e1 transition hover:bg-gray-800'

const cardClass = 'rounded-xl border border-gray-200 bg-white shadow-e2'

/** 细进度条。轨道中性灰，填充走主题色 —— 站内所有进度都用这一个形状 */
function Progress({ percent }: { percent: number }) {
  return (
    <div className="h-1 overflow-hidden rounded-full bg-gray-100">
      <div
        className="h-full rounded-full bg-brand-600 transition-all duration-300"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

/** 阶段角标：站内唯一保留阶段配色的地方，等宽字，面积很小 */
function LevelChip({ level, accent }: { level: string; accent: { bg: string; text: string } }) {
  return (
    <span
      className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-medium ${accent.bg} ${accent.text}`}
    >
      {level}
    </span>
  )
}

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
    <div>
      {/*
        标题不再包在一张彩色卡里 —— 页面自己就是容器，
        留白负责分区，卡片只留给真正需要边界的内容。
      */}
      <header className="max-w-2xl">
        <h1 className="text-[26px] font-semibold leading-[1.2] tracking-[-0.035em] sm:text-[32px]">
          选一条岗位路线
        </h1>
        <p className="mt-3 leading-relaxed text-gray-600">
          <span className="font-mono text-gray-900">{stats.lessonCount}</span> 节课不必都学。
          挑一个和你当前岗位最近的身份，下面会给出裁剪过的清单 ——
          只留这个岗位真正会用到的课，并切成几段推进。
        </p>
      </header>

      {/* 手机上四个标签排不下，直接横向滚动 */}
      <div className="-mx-3 mt-6 flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        {ROLE_PATHS.map((role) => {
          const active = role.id === tabId
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => setTabId(role.id)}
              aria-pressed={active}
              className={`shrink-0 rounded-lg border px-3.5 py-2 text-left transition ${
                active
                  ? 'border-gray-900 bg-white shadow-e2'
                  : 'border-gray-200 bg-white/60 hover:border-gray-300 hover:bg-white'
              }`}
            >
              <div
                className={`text-sm font-medium ${active ? 'text-gray-900' : 'text-gray-600'}`}
              >
                {role.title}
              </div>
              <div className="mt-0.5 font-mono text-[10px] text-gray-500">{role.alias}</div>
            </button>
          )
        })}
      </div>

      <RolePanel roleId={tabId} doneSet={doneSet} />
      <Catalog doneSet={doneSet} doneCount={doneCount} />
    </div>
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
    <div className={`mt-4 px-5 py-5 ${cardClass}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="font-medium text-gray-900">{tagline}</span>
        <span className="font-mono text-[11px] text-gray-500">{meta}</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">{desc}</p>
      <ul className="mt-3 space-y-1.5">
        {bullets.map((line) => (
          <li key={line} className="flex gap-2 text-[13px] leading-relaxed text-gray-600">
            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-brand-600" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <Progress percent={percent} />
      </div>
      {cta}
    </div>
  )
}

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
              {done > 0 ? '继续这条路线' : '沿这条路线开始'}
              <span className="text-gray-500">·</span>
              <span className="font-normal text-gray-300">
                第 <span className="font-mono">{resume.index}</span> 节
              </span>
              <span className="font-normal text-gray-100">{resume.lesson.title}</span>
            </Link>
          )
        }
      />

      <div className="mt-8 space-y-6">
        {path.stages.map(({ stage, items, minutes }) => (
          <div key={stage.title}>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <h2 className="text-[15px] font-semibold tracking-tight text-gray-900">
                {stage.title}
              </h2>
              <span className="font-mono text-[11px] text-gray-500">
                {items.length} 节 · {minutes} 分钟
              </span>
            </div>
            <p className="mt-1 text-[13px] leading-relaxed text-gray-500">{stage.hint}</p>

            {/* 一段课程是一张表：行与行之间只用发丝线分隔，不再各自成卡 */}
            <ol className={`mt-3 divide-y divide-gray-100 overflow-hidden ${cardClass}`}>
              {items.map((item) => {
                const isDone = doneSet.has(item.key)
                const depth = getDepth(item.track.id, item.lesson.id)
                return (
                  <li key={item.key}>
                    <Link
                      to="/learn/$trackId/$lessonId"
                      params={{ trackId: item.track.id, lessonId: item.lesson.id }}
                      search={{ role: roleId }}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 transition hover:bg-gray-50 sm:px-4"
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-medium ${
                          isDone
                            ? 'bg-emerald-600 text-white'
                            : 'border border-gray-200 bg-gray-50 text-gray-500'
                        }`}
                      >
                        {isDone ? '✓' : item.index}
                      </span>
                      <LevelChip level={item.track.level} accent={item.track.accent} />
                      <span className="min-w-0 flex-1 truncate text-sm text-gray-800">
                        {item.lesson.title}
                      </span>
                      {depth !== 'core' && (
                        <span
                          className={`hidden shrink-0 rounded border px-1.5 py-0.5 text-[10px] sm:inline ${DEPTH_STYLE[depth]}`}
                        >
                          {DEPTH_LABEL[depth]}
                        </span>
                      )}
                      <span className="shrink-0 font-mono text-[11px] text-gray-500">
                        {item.lesson.minutes}m
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ol>
          </div>
        ))}
      </div>

      <p className="mt-6 text-[13px] leading-relaxed text-gray-500">
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
    <div className={`mt-6 px-5 py-5 ${cardClass}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full flex-wrap items-baseline gap-x-2 gap-y-1 text-left"
      >
        <span className="font-medium text-gray-900">全部课程</span>
        <span className="font-mono text-[11px] text-gray-500">
          {stats.trackCount} 个阶段 · {stats.lessonCount} 节 · 约{' '}
          {Math.round(stats.totalMinutes / 60)} 小时 · 已完成 {doneCount}/{stats.lessonCount}
        </span>
        <span className="ml-auto shrink-0 text-xs font-medium text-brand-700">
          {open ? '收起' : '展开'}
        </span>
      </button>
      <div className="mt-3">
        <Progress percent={percent} />
      </div>

      {!open && (
        <p className="mt-3 text-[13px] leading-relaxed text-gray-500">
          不挑岗位、想按阶段通读，或者只想直接切进某个主题，就从这里进去。
          顺序是 <span className="font-mono text-gray-600">L0 → T → L1 → L2 → L3 → L4</span>。
        </p>
      )}

      {open && (
        <>
          <Link
            to="/learn/$trackId/$lessonId"
            params={{ trackId: resume.track.id, lessonId: resume.lesson.id }}
            className={ctaClass}
          >
            {doneCount > 0 ? '继续学习' : '从第一课开始'}
            <span className="text-gray-500">·</span>
            <span className="font-normal text-gray-100">{resume.lesson.title}</span>
          </Link>

          <div className="mt-5 space-y-3">
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
                  className="overflow-hidden rounded-lg border border-gray-200 bg-white"
                >
                  {/*
                    阶段头原来整条铺阶段浅色，六个阶段堆下来像一叠便利贴。
                    现在底色统一 canvas-soft，阶段色收进左侧那个实心角标里。
                  */}
                  <header className="flex items-start gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white font-mono text-[11px] font-medium ${track.accent.text}`}
                    >
                      {track.level}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <Link
                          to="/tracks/$trackId"
                          params={{ trackId: track.id }}
                          className="font-medium text-gray-900 hover:underline"
                        >
                          {track.title}
                        </Link>
                        <span className="text-[11px] text-gray-500">{track.subtitle}</span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-gray-600">{track.goal}</p>
                    </div>
                    <div className="shrink-0 font-mono text-[13px] font-medium text-gray-900">
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
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-medium ${
                                allDone
                                  ? 'bg-emerald-600 text-white'
                                  : 'border border-gray-200 bg-gray-50 text-gray-500'
                              }`}
                            >
                              {allDone ? '✓' : groupIndex + 1}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-baseline gap-x-2">
                                <span className="text-sm font-medium text-gray-900">
                                  {group.title}
                                </span>
                                <span className="font-mono text-[11px] text-gray-500">
                                  {lessons.length} 节 · {minutes} 分钟
                                </span>
                              </span>
                              <span className="mt-0.5 block text-xs leading-relaxed text-gray-500">
                                {group.hint}
                              </span>
                            </span>
                            <span className="mt-0.5 shrink-0 font-mono text-[11px] text-gray-500">
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
