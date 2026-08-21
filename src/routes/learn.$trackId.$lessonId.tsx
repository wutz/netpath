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
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center shadow-e2">
        <p className="text-gray-500">
          没有这节课：
          <span className="font-mono text-gray-700">
            {trackId}/{lessonId}
          </span>
        </p>
        <Link
          to="/"
          className="mt-4 inline-block rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
        >
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
        <nav className="text-xs text-gray-500">
          <Link to="/" className="transition hover:text-gray-900">
            学习路径
          </Link>
          <span className="mx-1.5 text-gray-400">/</span>
          <Link
            to="/tracks/$trackId"
            params={{ trackId: track.id }}
            className="transition hover:text-gray-900"
          >
            <span className="font-mono">{track.level}</span> {track.title}
          </Link>
          {group && (
            <>
              <span className="mx-1.5 text-gray-400">/</span>
              <a
                href={`/tracks/${track.id}#${group.id}`}
                className="transition hover:text-gray-900"
              >
                {group.title}
              </a>
            </>
          )}
        </nav>

        <RoleBanner roleNav={roleNav} role={role} track={track} lesson={lesson} />

        <header className="mt-4 border-b border-gray-200 pb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded border px-1.5 py-0.5 text-[11px] ${KIND_STYLE[lesson.kind]}`}
            >
              {KIND_LABEL[lesson.kind]}
            </span>
            {depth !== 'core' && (
              <span className={`rounded border px-1.5 py-0.5 text-[11px] ${DEPTH_STYLE[depth]}`}>
                {DEPTH_LABEL[depth]}
              </span>
            )}
            <span className="font-mono text-[11px] text-gray-500">预计 {lesson.minutes} 分钟</span>
            {passedCheckpoints > 0 && (
              <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-mono text-[11px] text-emerald-700">
                检查点 {passedCheckpoints} ✓
              </span>
            )}
          </div>
          <h1 className="mt-3 text-[26px] font-semibold leading-[1.2] tracking-[-0.035em] sm:text-[32px]">
            {lesson.title}
          </h1>
          <p className="mt-3 leading-relaxed text-gray-600">{lesson.summary}</p>
        </header>

        {/*
          学习目标。原来整块铺阶段浅色，和正文抢注意力；
          现在换成 canvas-soft + 发丝线，阶段色只留在圆点上。
        */}
        <section className="mt-6 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 sm:px-5">
          <h2 className="text-[13px] font-medium text-gray-900">学完这节你能做到</h2>
          <ul className="mt-2.5 space-y-2 text-sm text-gray-700">
            {lesson.objectives.map((objective) => (
              <li key={objective} className="flex gap-2.5">
                <span
                  className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${track.accent.dot}`}
                />
                {objective}
              </li>
            ))}
          </ul>
        </section>

        {prereqs.length > 0 && (
          <section className="mt-4 rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-e1 sm:px-5">
            <h2 className="text-[13px] font-medium text-gray-900">
              建议先学
              <span className="ml-2 font-normal text-gray-500">
                跳过这几节会看不懂本节的部分推导
              </span>
            </h2>
            <ul className="mt-2.5 flex flex-wrap gap-1.5">
              {prereqs.map((item) => {
                const ok = progress.done.includes(item.key)
                return (
                  <li key={item.key}>
                    <Link
                      to="/learn/$trackId/$lessonId"
                      params={{ trackId: item.track.id, lessonId: item.lesson.id }}
                      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition ${
                        ok
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className={ok ? 'text-emerald-600' : 'text-gray-400'}>
                        {ok ? '✓' : '○'}
                      </span>
                      <span className="font-mono text-[10px] text-gray-500">
                        {item.track.level}
                      </span>
                      {item.lesson.title}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        <LessonKeyContext.Provider value={key}>
          <div className="lesson-body mt-10">
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
          <section className="mt-12 rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-e1 sm:px-5">
            <h2 className="text-[13px] font-medium text-gray-900">延伸资料</h2>
            <ul className="mt-2.5 space-y-2 text-sm">
              {lesson.refs.map((ref) => (
                <li key={ref.label + (ref.path ?? ref.href ?? '')} className="flex gap-2.5">
                  <span className="text-gray-400">·</span>
                  {ref.href ? (
                    <a
                      href={ref.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-700 underline decoration-brand-200 underline-offset-2 transition hover:decoration-brand-600"
                    >
                      {ref.label} ↗
                    </a>
                  ) : (
                    <span className="text-gray-600">
                      {ref.label}
                      {ref.path && (
                        <code className="ml-1.5 rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-800">
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

        <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-gray-200 pt-6">
          <button
            type="button"
            onClick={() => setLessonDone(key, !done)}
            className={`rounded-md px-4 py-2.5 text-sm font-medium transition ${
              done
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                : 'bg-gray-900 text-white shadow-e1 hover:bg-gray-800'
            }`}
          >
            {done ? '✓ 已标记完成（点击取消）' : '标记为已完成'}
          </button>
          {next ? (
            <Link
              to="/learn/$trackId/$lessonId"
              params={{ trackId: next.track.id, lessonId: next.lesson.id }}
              search={search}
              className="rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
            >
              下一课：{next.lesson.title} <span className="text-gray-400">→</span>
            </Link>
          ) : (
            roleNav && (
              <span className="text-sm text-gray-500">
                这是「{roleNav.path.role.title}」路线的最后一节 🎉
              </span>
            )
          )}
        </div>

        {prev && (
          <nav className="mt-5">
            <Link
              to="/learn/$trackId/$lessonId"
              params={{ trackId: prev.track.id, lessonId: prev.lesson.id }}
              search={search}
              className="text-sm text-gray-500 transition hover:text-gray-900"
            >
              <span className="text-gray-400">←</span> {prev.lesson.title}
            </Link>
          </nav>
        )}
      </article>

      <aside className="mt-12 lg:mt-0">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-xl border border-gray-200 bg-white px-3 py-4 shadow-e2">
          {roleNav ? (
            /* 路线模式：右栏换成整条路线，不然读者看不到自己在跨阶段的哪一步 */
            <>
              <div className="px-2 text-[13px] font-medium text-gray-900">
                {roleNav.path.role.title}
              </div>
              <div className="mt-0.5 px-2 font-mono text-[11px] text-gray-500">
                {roleNav.current.index} / {roleNav.path.lessonCount}
              </div>
              <ol className="mt-3 space-y-3 text-sm">
                {roleNav.path.stages.map(({ stage, items }) => (
                  <li key={stage.title}>
                    <div className="px-2 text-[11px] font-medium text-gray-500">{stage.title}</div>
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
                              className={`block rounded-md px-2 py-1.5 leading-snug transition ${
                                active
                                  ? 'bg-gray-100 font-medium text-gray-900'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }`}
                            >
                              <span
                                className={`mr-1.5 text-xs ${itemDone ? 'text-emerald-600' : 'text-gray-300'}`}
                              >
                                {itemDone ? '✓' : '○'}
                              </span>
                              <span
                                className={`mr-1 rounded px-1 py-0.5 font-mono text-[10px] ${item.track.accent.bg} ${item.track.accent.text}`}
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
              <div className="px-2 text-[13px] font-medium text-gray-900">
                <span className={`font-mono ${track.accent.text}`}>{track.level}</span>{' '}
                {track.title}
              </div>
              <ol className="mt-3 space-y-3 text-sm">
                {groupedLessons(track).map(({ group: g, lessons }) => (
                  <li key={g.id}>
                    <div className="px-2 text-[11px] font-medium text-gray-500">{g.title}</div>
                    <ol className="mt-1 space-y-0.5">
                      {lessons.map((item) => {
                        const active = item.id === lesson.id
                        const itemDone = progress.done.includes(lessonKey(track.id, item.id))
                        return (
                          <li key={item.id}>
                            <Link
                              to="/learn/$trackId/$lessonId"
                              params={{ trackId: track.id, lessonId: item.id }}
                              className={`block rounded-md px-2 py-1.5 leading-snug transition ${
                                active
                                  ? 'bg-gray-100 font-medium text-gray-900'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }`}
                            >
                              <span
                                className={`mr-1.5 text-xs ${itemDone ? 'text-emerald-600' : 'text-gray-300'}`}
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
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs">
        <span className="text-amber-900">这一节没排进「{path.role.title}」路线</span>
        <Link to="/" className="ml-auto font-medium text-amber-900 underline hover:no-underline">
          回到路线 →
        </Link>
      </div>
    )
  }

  const { path, current, stage } = roleNav
  const percent = Math.round((current.index / path.lessonCount) * 100)

  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 shadow-e1">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="font-medium text-gray-900">{path.role.title} 路线</span>
        <span className="font-mono text-gray-500">
          {current.index} / {path.lessonCount}
          {stage && <span className="font-sans"> · {stage.title}</span>}
        </span>
        <Link
          to="/learn/$trackId/$lessonId"
          params={{ trackId: track.id, lessonId: lesson.id }}
          search={{}}
          className="ml-auto text-gray-500 transition hover:text-gray-900"
        >
          退出路线
        </Link>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-brand-600 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

function OutlinePlaceholder({ outline }: { outline: string[] }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white px-5 py-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600">
          正文待编写
        </span>
        <span className="text-xs text-gray-500">以下是本节已定稿的小节大纲</span>
      </div>
      <ol className="mt-4 space-y-2">
        {outline.map((item, index) => (
          <li key={item} className="flex gap-3 text-sm text-gray-700">
            <span className="w-5 shrink-0 text-right font-mono text-xs text-gray-500">
              {index + 1}
            </span>
            {item}
          </li>
        ))}
      </ol>
    </div>
  )
}
