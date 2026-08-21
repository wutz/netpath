import { MDXProvider } from '@mdx-js/react'
import { Link, createFileRoute } from '@tanstack/react-router'
import {
  DEPTH_LABEL,
  DEPTH_STYLE,
  KIND_LABEL,
  KIND_STYLE,
  LEVEL_CHIP,
  type Lesson,
  ROLE_PATHS,
  type Track,
  getDepth,
  getFlatNeighbors,
  getLesson,
  getPrereqs,
  getRoleNeighbors,
  getRolePath,
  groupedLessons,
  lessonKey,
} from '#/lib/curriculum'
import { getLessonContent } from '#/lib/content'
import { setLessonDone, useProgress } from '#/lib/progress'
import { LessonKeyContext } from '#/components/lesson-context'
import { mdxComponents } from '#/components/mdx-components'

export const Route = createFileRoute('/learn/$trackId/$lessonId')({
  /**
   * ?role=<岗位路线 id> —— 沿岗位路线阅读时带上，页面据此改「下一课」的目标与右侧目录。
   * 认不出的值直接丢掉，URL 被手改坏也不会让页面挂掉。
   */
  validateSearch: (search: Record<string, unknown>): { role?: string } => {
    const role = typeof search.role === 'string' ? search.role : undefined
    return role && ROLE_PATHS.some((r) => r.id === role) ? { role } : {}
  },
  component: LessonPage,
})

function LessonPage() {
  const { trackId, lessonId } = Route.useParams()
  const { role } = Route.useSearch()
  const found = getLesson(trackId, lessonId)
  const progress = useProgress()

  if (!found) {
    return (
      <div className="rounded-lg bg-canvas px-6 py-12 text-center shadow-card">
        <p className="text-body">
          没有这节课：{trackId}/{lessonId}
        </p>
        <Link to="/" className="mt-3 inline-block text-sm text-brand-600 hover:underline">
          返回学习路径
        </Link>
      </div>
    )
  }

  const { track, lesson, group } = found
  const key = lessonKey(track.id, lesson.id)
  const Content = getLessonContent(track.id, lesson.id)
  const done = progress.done.includes(key)
  const passedCheckpoints = progress.quiz.filter((q) => q.startsWith(`${key}#`)).length
  const prereqs = getPrereqs(track.id, lesson.id)
  const depth = getDepth(track.id, lesson.id)

  // 在路线上就按路线走，不在路线上（或没带 role）就退回全站线性顺序
  const roleNav = role ? getRoleNeighbors(role, track.id, lesson.id) : undefined
  const { prev, next } = roleNav ?? getFlatNeighbors(track.id, lesson.id)
  /** 路线模式下所有课内链接都要把 role 带上，否则点一下就掉出路线 */
  const search = roleNav ? { role } : {}

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-10">
      {/*
        正文列封顶 48rem。原来它会一路撑到 55rem 上下，一行能排到四十几个汉字，
        眼睛回行时容易串行 —— 阅读宽度是这一页最该管住的东西。
      */}
      <article className="min-w-0 max-w-[48rem]">
        <nav className="font-mono text-xs text-mute">
          <Link to="/" className="transition hover:text-ink">
            学习路径
          </Link>
          <span className="mx-1.5 text-line-strong">/</span>
          <Link
            to="/tracks/$trackId"
            params={{ trackId: track.id }}
            className="transition hover:text-ink"
          >
            {track.level} {track.title}
          </Link>
          {group && (
            <>
              <span className="mx-1.5 text-line-strong">/</span>
              <a href={`/tracks/${track.id}#${group.id}`} className="transition hover:text-ink">
                {group.title}
              </a>
            </>
          )}
        </nav>

        <RoleBanner roleNav={roleNav} role={role} track={track} lesson={lesson} />

        <header className="mt-4 border-b border-line pb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-xs px-1.5 py-0.5 text-[11px] ${KIND_STYLE[lesson.kind]}`}>
              {KIND_LABEL[lesson.kind]}
            </span>
            {depth !== 'core' && (
              <span className={`rounded-xs px-1.5 py-0.5 text-[11px] ${DEPTH_STYLE[depth]}`}>
                {DEPTH_LABEL[depth]}
              </span>
            )}
            <span className="font-mono text-[11px] text-mute">预计 {lesson.minutes} 分钟</span>
            {passedCheckpoints > 0 && (
              <span className="rounded-xs bg-info-soft px-1.5 py-0.5 font-mono text-[11px] text-info-deep">
                检查点通过 {passedCheckpoints}
              </span>
            )}
          </div>
          <h1 className="display-xl mt-3">{lesson.title}</h1>
          <p className="mt-3 text-[17px] leading-relaxed text-body">{lesson.summary}</p>
        </header>

        {/*
          学习目标。原来整块铺阶段浅色，和正文抢注意力；
          现在是一张普通白卡 + eyebrow 小标题，圆点退成中性灰。
        */}
        <section className="mt-6 rounded-md bg-canvas px-5 py-4 shadow-card">
          <h2 className="eyebrow">学完这节你能做到</h2>
          <ul className="mt-2.5 space-y-1.5 text-sm leading-relaxed text-body">
            {lesson.objectives.map((objective) => (
              <li key={objective} className="flex gap-2.5">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-line-strong" />
                {objective}
              </li>
            ))}
          </ul>
        </section>

        {prereqs.length > 0 && (
          <section className="mt-4 rounded-md bg-canvas px-5 py-4 shadow-card">
            <h2 className="eyebrow">建议先学</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-mute">
              跳过这几节会看不懂本节的部分推导
            </p>
            <ul className="mt-2.5 flex flex-wrap gap-1.5">
              {prereqs.map((item) => {
                const ok = progress.done.includes(item.key)
                return (
                  <li key={item.key}>
                    <Link
                      to="/learn/$trackId/$lessonId"
                      params={{ trackId: item.track.id, lessonId: item.lesson.id }}
                      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-xs transition ${
                        ok
                          ? 'border-transparent bg-soft-2 text-mute hover:text-ink'
                          : 'border-line bg-canvas text-body hover:border-line-strong hover:bg-soft hover:text-ink'
                      }`}
                    >
                      <span
                        className={`font-mono text-[11px] ${ok ? 'text-brand-600' : 'text-line-strong'}`}
                      >
                        {ok ? '✓' : '○'}
                      </span>
                      <span className="font-mono text-[10px] text-mute">{item.track.level}</span>
                      {item.lesson.title}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        <LessonKeyContext.Provider value={key}>
          <div className="lesson-body mt-8">
            {Content ? (
              <MDXProvider components={mdxComponents}>
                <Content />
              </MDXProvider>
            ) : (
              <OutlinePlaceholder outline={lesson.outline} />
            )}
          </div>
        </LessonKeyContext.Provider>

        {lesson.refs && lesson.refs.length > 0 && (
          <section className="mt-10 rounded-md bg-canvas px-5 py-4 shadow-card">
            <h2 className="eyebrow">延伸资料</h2>
            <ul className="mt-2.5 space-y-1.5 text-sm">
              {lesson.refs.map((ref) => (
                <li key={ref.label + (ref.path ?? ref.href ?? '')} className="flex gap-2.5">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-line-strong" />
                  {ref.href ? (
                    <a href={ref.href} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">
                      {ref.label} ↗
                    </a>
                  ) : (
                    <span className="text-body">
                      {ref.label}
                      {ref.path && (
                        <code className="ml-1.5 rounded-xs bg-soft-2 px-1.5 py-0.5 font-mono text-xs text-ink">
                          {ref.path}
                        </code>
                      )}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-line pt-6">
          <button
            type="button"
            onClick={() => setLessonDone(key, !done)}
            className={`rounded-sm px-4 py-2.5 text-sm font-medium transition ${
              done
                ? 'bg-soft-2 text-body shadow-hair hover:text-ink'
                : 'bg-brand-600 text-white hover:bg-brand-700'
            }`}
          >
            {done ? '✓ 已标记完成（点击取消）' : '标记为已完成'}
          </button>
          {next ? (
            <Link
              to="/learn/$trackId/$lessonId"
              params={{ trackId: next.track.id, lessonId: next.lesson.id }}
              search={search}
              className="rounded-sm bg-canvas px-4 py-2.5 text-sm font-medium text-ink shadow-card transition hover:shadow-float"
            >
              下一课：{next.lesson.title} →
            </Link>
          ) : (
            roleNav && (
              <span className="text-sm text-mute">
                这是「{roleNav.path.role.title}」路线的最后一节 🎉
              </span>
            )
          )}
        </div>

        {prev && (
          <nav className="mt-6">
            <Link
              to="/learn/$trackId/$lessonId"
              params={{ trackId: prev.track.id, lessonId: prev.lesson.id }}
              search={search}
              className="text-sm text-mute transition hover:text-ink"
            >
              ← {prev.lesson.title}
            </Link>
          </nav>
        )}
      </article>

      <aside className="mt-12 lg:mt-0">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-md bg-canvas px-3 py-4 shadow-card">
          {roleNav ? (
            /* 路线模式：右栏换成整条路线，不然读者看不到自己在跨阶段的哪一步 */
            <>
              <div className="px-2">
                <div className="eyebrow">{roleNav.path.role.title}</div>
                <div className="mt-1 font-mono text-[11px] text-mute">
                  第 {roleNav.current.index} / {roleNav.path.lessonCount} 节
                </div>
              </div>
              <ol className="mt-3 space-y-3 text-sm">
                {roleNav.path.stages.map(({ stage, items }) => (
                  <li key={stage.title}>
                    <div className="px-2 text-[11px] font-medium text-mute">{stage.title}</div>
                    <ol className="mt-1 space-y-0.5">
                      {items.map((item) => (
                        <li key={item.key}>
                          <SidebarLink
                            trackId={item.track.id}
                            lessonId={item.lesson.id}
                            title={item.lesson.title}
                            level={item.track.level}
                            search={{ role }}
                            active={item.key === key}
                            done={progress.done.includes(item.key)}
                          />
                        </li>
                      ))}
                    </ol>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <>
              <div className="px-2">
                <div className="eyebrow">
                  {track.level} · {track.title}
                </div>
              </div>
              <ol className="mt-3 space-y-3 text-sm">
                {groupedLessons(track).map(({ group: g, lessons }) => (
                  <li key={g.id}>
                    <div className="px-2 text-[11px] font-medium text-mute">{g.title}</div>
                    <ol className="mt-1 space-y-0.5">
                      {lessons.map((item) => (
                        <li key={item.id}>
                          <SidebarLink
                            trackId={track.id}
                            lessonId={item.id}
                            title={item.title}
                            search={{}}
                            active={item.id === lesson.id}
                            done={progress.done.includes(lessonKey(track.id, item.id))}
                          />
                        </li>
                      ))}
                    </ol>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      </aside>
    </div>
  )
}

/**
 * 路线模式的提示条：告诉读者「你正走在哪条线上、走到第几节」，并给一个退出口。
 * 没带 role 时什么都不渲染，按目录顺序阅读的人不受影响。
 */
function RoleBanner({
  roleNav,
  role,
  track,
  lesson,
}: {
  roleNav: ReturnType<typeof getRoleNeighbors>
  role?: string
  track: Track
  lesson: Lesson
}) {
  if (!role) return null

  // URL 上带了 role，但这一节没排进那条路线 —— 只可能是手改地址进来的
  if (!roleNav) {
    const path = getRolePath(role)
    if (!path) return null
    return (
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-sm bg-warn-soft px-3.5 py-2.5 text-xs">
        <span className="text-warn-deep">这一节没排进「{path.role.title}」路线</span>
        <Link to="/" className="ml-auto text-warn-deep underline underline-offset-2">
          回到路线 →
        </Link>
      </div>
    )
  }

  const { path, current, stage } = roleNav
  const percent = Math.round((current.index / path.lessonCount) * 100)

  return (
    <div className="mt-4 rounded-sm bg-canvas px-3.5 py-2.5 shadow-card">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="font-medium text-ink">{path.role.title} 路线</span>
        <span className="font-mono text-[11px] text-mute">
          {current.index} / {path.lessonCount}
          {stage && ` · ${stage.title}`}
        </span>
        <Link
          to="/learn/$trackId/$lessonId"
          params={{ trackId: track.id, lessonId: lesson.id }}
          search={{}}
          className="ml-auto text-mute transition hover:text-ink"
        >
          退出路线
        </Link>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-soft-2">
        <div className="h-full rounded-full bg-brand-600" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

/** 右栏的课目链接：当前课反白，学过的打品牌色勾 */
function SidebarLink({
  trackId,
  lessonId,
  title,
  level,
  search,
  active,
  done,
}: {
  trackId: string
  lessonId: string
  title: string
  level?: string
  search: { role?: string }
  active: boolean
  done: boolean
}) {
  return (
    <Link
      to="/learn/$trackId/$lessonId"
      params={{ trackId, lessonId }}
      search={search}
      className={`flex gap-1.5 rounded-sm px-2 py-1.5 text-[13px] leading-snug transition ${
        active ? 'bg-soft-2 font-medium text-ink' : 'text-body hover:bg-soft'
      }`}
    >
      <span
        className={`shrink-0 font-mono text-[11px] ${done ? 'text-brand-600' : 'text-line-strong'}`}
      >
        {done ? '✓' : '○'}
      </span>
      <span className="min-w-0">
        {level && <span className={`mr-1 ${LEVEL_CHIP}`}>{level}</span>}
        {title}
      </span>
    </Link>
  )
}

function OutlinePlaceholder({ outline }: { outline: string[] }) {
  return (
    <div className="rounded-md border border-dashed border-line-strong/50 bg-canvas px-5 py-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-xs bg-soft-2 px-2 py-0.5 text-xs text-body">正文待编写</span>
        <span className="text-xs text-mute">以下是本节已定稿的小节大纲</span>
      </div>
      <ol className="mt-4 space-y-2">
        {outline.map((item, index) => (
          <li key={item} className="flex gap-3 text-sm text-body">
            <span className="w-5 shrink-0 text-right font-mono text-xs text-mute">{index + 1}</span>
            {item}
          </li>
        ))}
      </ol>
    </div>
  )
}
