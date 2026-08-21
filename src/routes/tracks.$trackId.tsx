import { Link, createFileRoute } from '@tanstack/react-router'
import {
  DEPTH_LABEL,
  DEPTH_STYLE,
  KIND_LABEL,
  KIND_STYLE,
  getDepth,
  getTrack,
  groupedLessons,
  lessonKey,
} from '#/lib/curriculum'
import { useProgress } from '#/lib/progress'

export const Route = createFileRoute('/tracks/$trackId')({
  component: TrackPage,
})

function TrackPage() {
  const { trackId } = Route.useParams()
  const track = getTrack(trackId)
  const progress = useProgress()

  if (!track) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center shadow-e2">
        <p className="text-gray-500">
          没有这个阶段：<span className="font-mono text-gray-700">{trackId}</span>
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

  const doneSet = new Set(progress.done)
  const groups = groupedLessons(track)
  const lessonCount = groups.reduce((sum, g) => sum + g.lessons.length, 0)
  const doneCount = groups.reduce(
    (sum, g) => sum + g.lessons.filter((l) => doneSet.has(lessonKey(track.id, l.id))).length,
    0,
  )
  const totalMinutes = groups.reduce((sum, g) => sum + g.minutes, 0)
  const percent = lessonCount > 0 ? Math.round((doneCount / lessonCount) * 100) : 0

  // 跨小组连续编号，回答"这个阶段我学到第几节了"
  let counter = 0

  return (
    <div className="space-y-8">
      <nav className="text-xs text-gray-500">
        <Link to="/" className="transition hover:text-gray-900">
          学习路径
        </Link>
        <span className="mx-1.5 text-gray-400">/</span>
        <span className="text-gray-700">
          <span className="font-mono">{track.level}</span> {track.title}
        </span>
      </nav>

      {/*
        阶段头原来整块铺阶段浅色。改成中性卡 + 一个带色角标：
        颜色仍在，但不再占据视野里最大的一块面积。
      */}
      <header className="rounded-xl border border-gray-200 bg-white px-5 py-6 shadow-e2 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span
            className={`rounded-md border border-gray-200 bg-gray-50 px-2 py-1 font-mono text-[13px] font-medium ${track.accent.text}`}
          >
            {track.level}
          </span>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] sm:text-[28px]">
            {track.title}
          </h1>
          <span className="text-sm text-gray-500">{track.subtitle}</span>
        </div>
        <p className="mt-3 max-w-3xl leading-relaxed text-gray-600">{track.goal}</p>

        <div className="mt-5 max-w-md">
          <div className="flex items-baseline justify-between font-mono text-[11px] text-gray-500">
            <span>
              {groups.length} 个小组 · {lessonCount} 节课 · 约 {Math.round(totalMinutes / 60)} 小时
            </span>
            <span className="text-gray-700">
              {doneCount}/{lessonCount}
            </span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-brand-600 transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* 小组导航：手机上一屏内就能看完整个阶段的结构 */}
        <div className="mt-5 flex flex-wrap gap-1.5 border-t border-gray-100 pt-4">
          {groups.map(({ group, lessons }, index) => (
            <a
              key={group.id}
              href={`#${group.id}`}
              className="rounded-md border border-gray-200 px-2.5 py-1 text-xs text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
            >
              <span className="font-mono text-gray-500">{index + 1}</span> {group.title}
              <span className="ml-1.5 font-mono text-gray-500">{lessons.length}</span>
            </a>
          ))}
        </div>
      </header>

      {groups.map(({ group, lessons, minutes, readyCount }, groupIndex) => {
        const groupDone = lessons.filter((l) => doneSet.has(lessonKey(track.id, l.id))).length

        return (
          <section key={group.id} id={group.id} className="space-y-3">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-gray-200 pb-2.5">
              <h2 className="text-lg font-semibold tracking-tight">
                <span className={`mr-2 font-mono text-base ${track.accent.text}`}>
                  {groupIndex + 1}
                </span>
                {group.title}
              </h2>
              <span className="font-mono text-[11px] text-gray-500">
                {lessons.length} 节 · {minutes} 分钟
                {readyCount < lessons.length && ` · 正文 ${readyCount}/${lessons.length}`}
                {groupDone > 0 && ` · 已完成 ${groupDone}`}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-gray-600">{group.hint}</p>

            <ol className="space-y-2.5">
              {lessons.map((lesson) => {
                counter += 1
                const done = doneSet.has(lessonKey(track.id, lesson.id))
                const depth = getDepth(track.id, lesson.id)
                return (
                  <li key={lesson.id}>
                    <Link
                      to="/learn/$trackId/$lessonId"
                      params={{ trackId: track.id, lessonId: lesson.id }}
                      className="block rounded-lg border border-gray-200 bg-white px-4 py-4 shadow-e2 transition hover:border-gray-300 hover:shadow-e3 sm:px-5"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-medium ${
                            done
                              ? 'bg-emerald-600 text-white'
                              : 'border border-gray-200 bg-gray-50 text-gray-500'
                          }`}
                        >
                          {done ? '✓' : counter}
                        </span>
                        <h3 className="font-medium text-gray-900">{lesson.title}</h3>
                        <span
                          className={`rounded border px-1.5 py-0.5 text-[11px] ${KIND_STYLE[lesson.kind]}`}
                        >
                          {KIND_LABEL[lesson.kind]}
                        </span>
                        {depth !== 'core' && (
                          <span
                            className={`rounded border px-1.5 py-0.5 text-[11px] ${DEPTH_STYLE[depth]}`}
                          >
                            {DEPTH_LABEL[depth]}
                          </span>
                        )}
                        <span className="font-mono text-[11px] text-gray-500">
                          {lesson.minutes}m
                        </span>
                        {lesson.status === 'planned' && (
                          <span className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[11px] text-gray-500">
                            仅大纲
                          </span>
                        )}
                      </div>

                      <p className="mt-2.5 text-sm leading-relaxed text-gray-600">
                        {lesson.summary}
                      </p>

                      <ul className="mt-3 space-y-1 text-xs text-gray-500">
                        {lesson.objectives.map((objective) => (
                          <li key={objective} className="flex gap-2">
                            <span className="text-gray-400">→</span>
                            {objective}
                          </li>
                        ))}
                      </ul>
                    </Link>
                  </li>
                )
              })}
            </ol>
          </section>
        )
      })}
    </div>
  )
}
