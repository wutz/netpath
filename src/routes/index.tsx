import { type ReactNode, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import {
  DEPTH_LABEL,
  DEPTH_STYLE,
  LEVEL_CHIP,
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

/** 品牌色主按钮 —— 站间约定：动作一律走 brand，墨黑只做标题与深色面板 */
const ctaClass =
  'mt-5 inline-flex items-center gap-1.5 rounded-sm bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700'

/** 细进度条。轨道 soft-2，填充走品牌色 —— 站内所有进度都用这一个形状 */
function Progress({ percent }: { percent: number }) {
  return (
    <div className="h-1 overflow-hidden rounded-full bg-soft-2">
      <div
        className="h-full rounded-full bg-brand-600 transition-all duration-300"
        style={{ width: `${percent}%` }}
      />
    </div>
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
      <header>
        <div className="eyebrow">
          {stats.lessonCount} lessons · {stats.trackCount} tracks · {ROLE_PATHS.length} paths
        </div>
        <h1 className="display-2xl mt-3">选一条岗位路线。</h1>
        <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-body">
          <span className="font-mono">{stats.lessonCount}</span> 节课不必都学。
          挑一个和你当前岗位最近的身份，下面会给出裁剪过的清单 ——
          只留这个岗位真正会用到的课，并切成几段推进。
        </p>
      </header>

      {/* 手机上四张卡竖着排，桌面一行铺开；选中态用左侧一道品牌色竖条挑明 */}
      <div className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {ROLE_PATHS.map((role) => {
          const active = role.id === tabId
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => setTabId(role.id)}
              aria-pressed={active}
              className={`rounded-md border-l-2 px-4 py-3 text-left transition ${
                active
                  ? 'border-brand-600 bg-canvas shadow-soft'
                  : 'border-transparent bg-soft-2 text-body hover:bg-canvas hover:shadow-card'
              }`}
            >
              <div className={`text-sm font-medium ${active ? 'text-ink' : 'text-body'}`}>
                {role.title}
              </div>
              <div className="mt-0.5 font-mono text-[11px] text-mute">{role.alias}</div>
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
    <div className="mt-3 rounded-lg bg-canvas px-5 py-5 shadow-soft sm:px-6 sm:py-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="display-md">{tagline}</h2>
        <span className="font-mono text-xs text-mute">{meta}</span>
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-body">{desc}</p>
      <ul className="mt-4 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
        {bullets.map((line) => (
          <li key={line} className="flex gap-2 text-sm leading-relaxed text-body">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-line-strong" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex items-center gap-3">
        <Progress percent={percent} />
        <span className="shrink-0 font-mono text-[11px] text-mute">{percent}%</span>
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
              <span className="text-white/60">·</span>
              <span className="font-normal text-white/80">
                第 <span className="font-mono">{resume.index}</span> 节{' '}
                {resume.lesson.title}
              </span>
            </Link>
          )
        }
      />

      <div className="mt-10 space-y-8">
        {path.stages.map(({ stage, items, minutes }, index) => (
          <div key={stage.title}>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
              <span className="eyebrow">Stage {index + 1}</span>
              <h3 className="display-sm">{stage.title}</h3>
              <span className="font-mono text-[11px] text-mute">
                {items.length} 节 · {minutes} 分钟
              </span>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-body">{stage.hint}</p>

            {/* 一段课程是一张表：行与行之间只用发丝线分隔，不再各自成卡 */}
            <ol className="mt-3 divide-y divide-line overflow-hidden rounded-md bg-canvas shadow-card">
              {items.map((item) => {
                const isDone = doneSet.has(item.key)
                const depth = getDepth(item.track.id, item.lesson.id)
                return (
                  <li key={item.key}>
                    <Link
                      to="/learn/$trackId/$lessonId"
                      params={{ trackId: item.track.id, lessonId: item.lesson.id }}
                      search={{ role: roleId }}
                      className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-soft sm:px-5"
                    >
                      <Marker done={isDone}>{item.index}</Marker>
                      <span className={LEVEL_CHIP}>{item.track.level}</span>
                      <span className="min-w-0 flex-1 truncate text-sm text-ink">
                        {item.lesson.title}
                      </span>
                      {depth !== 'core' && (
                        <span
                          className={`hidden shrink-0 rounded-xs px-1.5 py-0.5 text-[10px] sm:inline ${DEPTH_STYLE[depth]}`}
                        >
                          {DEPTH_LABEL[depth]}
                        </span>
                      )}
                      <span className="shrink-0 font-mono text-[11px] text-mute">
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

      <p className="mt-6 text-sm leading-relaxed text-mute">
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
    <div className="mt-6 rounded-lg bg-canvas px-5 py-5 shadow-soft sm:px-6 sm:py-6">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full flex-wrap items-baseline gap-x-2 gap-y-1 text-left"
      >
        <span className="font-medium text-ink">全部课程</span>
        <span className="font-mono text-[11px] text-mute">
          {stats.trackCount} 个阶段 · {stats.lessonCount} 节 · 约{' '}
          {Math.round(stats.totalMinutes / 60)} 小时 · 已完成 {doneCount}/{stats.lessonCount}
        </span>
        <span className="ml-auto shrink-0 text-xs font-medium text-brand-600">
          {open ? '收起' : '展开'}
        </span>
      </button>
      <div className="mt-3 flex items-center gap-3">
        <Progress percent={percent} />
        <span className="shrink-0 font-mono text-[11px] text-mute">{percent}%</span>
      </div>

      {!open && (
        <p className="mt-3 text-sm leading-relaxed text-mute">
          不挑岗位、想按阶段通读，或者只想直接切进某个主题，就从这里进去。
          顺序是 <span className="font-mono">L0 → T → L1 → L2 → L3 → L4</span>。
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
            <span className="text-white/60">·</span>
            <span className="font-normal text-white/80">{resume.lesson.title}</span>
          </Link>

          <div className="mt-6 space-y-3">
            {tracks.map((track) => {
              const groups = groupedLessons(track)
              const lessonCount = groups.reduce((sum, g) => sum + g.lessons.length, 0)
              const trackDone = groups.reduce(
                (sum, g) =>
                  sum + g.lessons.filter((l) => doneSet.has(lessonKey(track.id, l.id))).length,
                0,
              )

              return (
                <article key={track.id} className="overflow-hidden rounded-md bg-canvas shadow-card">
                  <header className="flex items-start gap-3 border-b border-line bg-soft px-4 py-3.5 sm:px-5">
                    <span className="mt-0.5 shrink-0 rounded-xs bg-canvas px-2 py-1 font-mono text-xs text-ink shadow-hair">
                      {track.level}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <Link
                          to="/tracks/$trackId"
                          params={{ trackId: track.id }}
                          className="text-[15px] font-semibold tracking-[-0.02em] hover:underline"
                        >
                          {track.title}
                        </Link>
                        <span className="font-mono text-[11px] text-mute">{track.subtitle}</span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-body">{track.goal}</p>
                    </div>
                    <span className="shrink-0 font-mono text-xs text-mute">
                      {trackDone}/{lessonCount}
                    </span>
                  </header>

                  <ol className="divide-y divide-line">
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
                            className="flex items-start gap-3 px-4 py-2.5 transition hover:bg-soft sm:px-5"
                          >
                            <Marker done={allDone}>{groupIndex + 1}</Marker>
                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-baseline gap-x-2">
                                <span className="text-sm font-medium text-ink">{group.title}</span>
                                <span className="font-mono text-[11px] text-mute">
                                  {lessons.length} 节 · {minutes} 分钟
                                </span>
                              </span>
                              <span className="mt-0.5 block text-xs leading-relaxed text-mute">
                                {group.hint}
                              </span>
                            </span>
                            <span className="mt-0.5 shrink-0 font-mono text-[11px] text-mute">
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

/** 完成标记：做完的品牌色实心，没做的退到中性底 —— 与 storpath / kubepath 同一个形状 */
function Marker({ done, children }: { done: boolean; children: ReactNode }) {
  return (
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] ${
        done ? 'bg-brand-600 text-white' : 'bg-soft-2 text-mute'
      }`}
    >
      {done ? '✓' : children}
    </span>
  )
}
