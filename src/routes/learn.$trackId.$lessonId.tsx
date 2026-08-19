import { MDXProvider } from '@mdx-js/react'
import { Link, createFileRoute } from '@tanstack/react-router'
import {
  DEPTH_LABEL,
  DEPTH_STYLE,
  KIND_LABEL,
  KIND_STYLE,
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
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-10 text-center">
        <p className="text-gray-500">
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

  // 在路线上就按路线走，不在路线上（或没带 role）就退回全站线性顺序
  const roleNav = role ? getRoleNeighbors(role, track.id, lesson.id) : undefined
  const { prev, next } = roleNav ?? getFlatNeighbors(track.id, lesson.id)
  /** 路线模式下所有课内链接都要把 role 带上，否则点一下就掉出路线 */
  const search = roleNav ? { role } : {}

  return (
    <div className="lg:grid lg:grid-cols-[1fr_15rem] lg:gap-8">
      <article className="min-w-0">
        <nav className="text-xs text-gray-400">
          <Link to="/" className="hover:text-gray-700">
            学习路径
          </Link>
          <span className="mx-1.5">/</span>
          <Link
            to="/tracks/$trackId"
            params={{ trackId: track.id }}
            className="hover:text-gray-700"
          >
            {track.level} {track.title}
          </Link>
          {group && (
            <>
              <span className="mx-1.5">/</span>
              <a href={`/tracks/${track.id}#${group.id}`} className="hover:text-gray-700">
                {group.title}
              </a>
            </>
          )}
        </nav>

        <RoleBanner roleNav={roleNav} role={role} track={track} lesson={lesson} />

        <header className="mt-3 border-b border-gray-200 pb-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded px-1.5 py-0.5 text-[11px] ${KIND_STYLE[lesson.kind]}`}>
              {KIND_LABEL[lesson.kind]}
            </span>
            {getDepth(track.id, lesson.id) !== 'core' && (
              <span
                className={`rounded px-1.5 py-0.5 text-[11px] ${DEPTH_STYLE[getDepth(track.id, lesson.id)]}`}
              >
                {DEPTH_LABEL[getDepth(track.id, lesson.id)]}
              </span>
            )}
            <span className="text-xs text-gray-400">预计 {lesson.minutes} 分钟</span>
            {passedCheckpoints > 0 && (
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[11px] text-emerald-700">
                检查点通过 {passedCheckpoints}
              </span>
            )}
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{lesson.title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-600 sm:text-base">{lesson.summary}</p>
        </header>

        <section className={`mt-6 rounded-xl border px-4 py-4 sm:px-5 ${track.accent.border} ${track.accent.bg}`}>
          <h2 className={`text-sm font-semibold ${track.accent.text}`}>学完这节你能做到</h2>
          <ul className="mt-2 space-y-1.5 text-sm text-gray-700">
            {lesson.objectives.map((objective) => (
              <li key={objective} className="flex gap-2">
                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${track.accent.dot}`} />
                {objective}
              </li>
            ))}
          </ul>
        </section>

        {prereqs.length > 0 && (
          <section className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <h2 className="text-xs font-semibold text-gray-500">
              建议先学
              <span className="ml-1.5 font-normal text-gray-400">
                跳过这几节会看不懂本节的部分推导
              </span>
            </h2>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {prereqs.map((item) => {
                const ok = progress.done.includes(item.key)
                return (
                  <li key={item.key}>
                    <Link
                      to="/learn/$trackId/$lessonId"
                      params={{ trackId: item.track.id, lessonId: item.lesson.id }}
                      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs transition ${
                        ok
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-brand-500 hover:text-brand-700'
                      }`}
                    >
                      <span className={ok ? 'text-emerald-500' : 'text-gray-300'}>
                        {ok ? '✓' : '○'}
                      </span>
                      <span className="text-[10px] text-gray-400">{item.track.level}</span>
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
          <section className="mt-10 rounded-xl border border-gray-200 bg-white px-4 py-4 sm:px-5">
            <h2 className="text-sm font-semibold text-gray-900">延伸资料</h2>
            <ul className="mt-2 space-y-1.5 text-sm">
              {lesson.refs.map((ref) => (
                <li key={ref.label + (ref.path ?? ref.href ?? '')} className="flex gap-2">
                  <span className="text-gray-300">·</span>
                  {ref.href ? (
                    <a
                      href={ref.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-600 hover:underline"
                    >
                      {ref.label} ↗
                    </a>
                  ) : (
                    <span className="text-gray-600">
                      {ref.label}
                      {ref.path && (
                        <code className="ml-1.5 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">
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

        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-gray-200 pt-6">
          <button
            type="button"
            onClick={() => setLessonDone(key, !done)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              done
                ? 'border border-emerald-300 bg-emerald-50 text-emerald-700'
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
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
            >
              下一课：{next.lesson.title} →
            </Link>
          ) : (
            roleNav && (
              <span className="text-sm text-gray-500">
                这是「{roleNav.path.role.title}」路线的最后一节 🎉
              </span>
            )
          )}
        </div>

        <nav className="mt-6 flex justify-between text-sm">
          {prev ? (
            <Link
              to="/learn/$trackId/$lessonId"
              params={{ trackId: prev.track.id, lessonId: prev.lesson.id }}
              search={search}
              className="text-gray-500 hover:text-brand-600"
            >
              ← {prev.lesson.title}
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </article>

      <aside className="mt-10 lg:mt-0">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-xl border border-gray-200 bg-white px-4 py-4">
          {roleNav ? (
            /* 路线模式：右栏换成整条路线，不然读者看不到自己在跨阶段的哪一步 */
            <>
              <div className="text-xs font-semibold text-gray-500">
                {roleNav.path.role.title}
              </div>
              <div className="mt-0.5 text-[11px] text-gray-400">
                第 {roleNav.current.index} / {roleNav.path.lessonCount} 节
              </div>
              <ol className="mt-2 space-y-2.5 text-sm">
                {roleNav.path.stages.map(({ stage, items }) => (
                  <li key={stage.title}>
                    <div className="px-2 text-[11px] font-semibold tracking-wide text-gray-400">
                      {stage.title}
                    </div>
                    <ol className="mt-1 space-y-0.5">
                      {items.map((item) => {
                        const active = item.key === key
                        const itemDone = progress.done.includes(item.key)
                        return (
                          <li key={item.key}>
                            <Link
                              to="/learn/$trackId/$lessonId"
                              params={{ trackId: item.track.id, lessonId: item.lesson.id }}
                              search={{ role }}
                              className={`block rounded-lg px-2 py-1.5 leading-snug transition ${
                                active
                                  ? 'bg-brand-50 font-medium text-brand-700'
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              <span
                                className={`mr-1.5 text-xs ${itemDone ? 'text-emerald-500' : 'text-gray-300'}`}
                              >
                                {itemDone ? '✓' : '○'}
                              </span>
                              <span
                                className={`mr-1 rounded px-1 py-0.5 text-[10px] ${item.track.accent.bg} ${item.track.accent.text}`}
                              >
                                {item.track.level}
                              </span>
                              {item.lesson.title}
                            </Link>
                          </li>
                        )
                      })}
                    </ol>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <>
              <div className="text-xs font-semibold text-gray-500">
                {track.level} · {track.title}
              </div>
              <ol className="mt-2 space-y-2.5 text-sm">
                {groupedLessons(track).map(({ group: g, lessons }) => (
                  <li key={g.id}>
                    <div className="px-2 text-[11px] font-semibold tracking-wide text-gray-400">
                      {g.title}
                    </div>
                    <ol className="mt-1 space-y-0.5">
                      {lessons.map((item) => {
                        const active = item.id === lesson.id
                        const itemDone = progress.done.includes(lessonKey(track.id, item.id))
                        return (
                          <li key={item.id}>
                            <Link
                              to="/learn/$trackId/$lessonId"
                              params={{ trackId: track.id, lessonId: item.id }}
                              className={`block rounded-lg px-2 py-1.5 leading-snug transition ${
                                active
                                  ? 'bg-brand-50 font-medium text-brand-700'
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              <span
                                className={`mr-1.5 text-xs ${itemDone ? 'text-emerald-500' : 'text-gray-300'}`}
                              >
                                {itemDone ? '✓' : '○'}
                              </span>
                              {item.title}
                            </Link>
                          </li>
                        )
                      })}
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
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs">
        <span className="text-amber-800">这一节没排进「{path.role.title}」路线</span>
        <Link to="/" className="ml-auto text-amber-700 underline hover:text-amber-900">
          回到路线 →
        </Link>
      </div>
    )
  }

  const { path, current, stage } = roleNav
  const percent = Math.round((current.index / path.lessonCount) * 100)

  return (
    <div className="mt-3 rounded-xl border border-brand-200 bg-brand-50/70 px-3.5 py-2.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="font-semibold text-brand-700">{path.role.title} 路线</span>
        <span className="text-gray-500">
          第 {current.index} / {path.lessonCount} 节
          {stage && ` · ${stage.title}`}
        </span>
        <Link
          to="/learn/$trackId/$lessonId"
          params={{ trackId: track.id, lessonId: lesson.id }}
          search={{}}
          className="ml-auto text-gray-400 hover:text-gray-700"
        >
          退出路线
        </Link>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/80">
        <div className="h-full rounded-full bg-brand-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

function OutlinePlaceholder({ outline }: { outline: string[] }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white px-5 py-5">
      <div className="flex items-center gap-2">
        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
          正文待编写
        </span>
        <span className="text-xs text-gray-400">以下是本节已定稿的小节大纲</span>
      </div>
      <ol className="mt-4 space-y-2">
        {outline.map((item, index) => (
          <li key={item} className="flex gap-3 text-sm text-gray-700">
            <span className="w-5 shrink-0 text-right font-mono text-xs text-gray-400">
              {index + 1}
            </span>
            {item}
          </li>
        ))}
      </ol>
    </div>
  )
}
