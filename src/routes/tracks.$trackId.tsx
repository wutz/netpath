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
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-10 text-center">
        <p className="text-gray-500">没有这个阶段：{trackId}</p>
        <Link to="/" className="mt-3 inline-block text-sm text-brand-600 hover:underline">
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

  // 跨小组连续编号，回答"这个阶段我学到第几节了"
  let counter = 0

  return (
    <div className="space-y-6">
      <nav className="text-xs text-gray-400">
        <Link to="/" className="hover:text-gray-700">
          学习路径
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-gray-600">
          {track.level} {track.title}
        </span>
      </nav>

      <header className={`rounded-2xl border px-6 py-6 ${track.accent.border} ${track.accent.bg}`}>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`rounded-lg bg-white px-2.5 py-1 text-sm font-bold shadow-sm ${track.accent.text}`}
          >
            {track.level}
          </span>
          <h1 className="text-2xl font-bold">{track.title}</h1>
          <span className="text-sm text-gray-500">{track.subtitle}</span>
        </div>
        <p className="mt-3 max-w-3xl leading-relaxed text-gray-700">{track.goal}</p>
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
          <span>
            {groups.length} 个小组 · {lessonCount} 节课 · 约 {Math.round(totalMinutes / 60)} 小时
          </span>
          <span>
            已完成 {doneCount}/{lessonCount}
          </span>
        </div>

        {/* 小组导航：手机上一屏内就能看完整个阶段的结构 */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {groups.map(({ group, lessons }, index) => (
            <a
              key={group.id}
              href={`#${group.id}`}
              className="rounded-lg bg-white/70 px-2.5 py-1 text-xs text-gray-700 transition hover:bg-white"
            >
              {index + 1}. {group.title}
              <span className="ml-1 text-gray-400">{lessons.length}</span>
            </a>
          ))}
        </div>
      </header>

      {groups.map(({ group, lessons, minutes, readyCount }, groupIndex) => {
        const groupDone = lessons.filter((l) => doneSet.has(lessonKey(track.id, l.id))).length

        return (
          <section key={group.id} id={group.id} className="space-y-3">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-gray-200 pb-2">
              <h2 className="text-lg font-bold">
                <span className={`mr-2 ${track.accent.text}`}>{groupIndex + 1}</span>
                {group.title}
              </h2>
              <span className="text-xs text-gray-400">
                {lessons.length} 节 · {minutes} 分钟
                {readyCount < lessons.length && ` · 正文 ${readyCount}/${lessons.length}`}
                {groupDone > 0 && ` · 已完成 ${groupDone}`}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-gray-600">{group.hint}</p>

            <ol className="space-y-3">
              {lessons.map((lesson) => {
                counter += 1
                const done = doneSet.has(lessonKey(track.id, lesson.id))
                return (
                  <li key={lesson.id}>
                    <Link
                      to="/learn/$trackId/$lessonId"
                      params={{ trackId: track.id, lessonId: lesson.id }}
                      className="block rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm transition hover:border-brand-500 hover:shadow"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium ${
                            done ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {done ? '✓' : counter}
                        </span>
                        <h3 className="font-semibold text-gray-900">{lesson.title}</h3>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[11px] ${KIND_STYLE[lesson.kind]}`}
                        >
                          {KIND_LABEL[lesson.kind]}
                        </span>
                        {getDepth(track.id, lesson.id) !== 'core' && (
                          <span
                            className={`rounded px-1.5 py-0.5 text-[11px] ${DEPTH_STYLE[getDepth(track.id, lesson.id)]}`}
                          >
                            {DEPTH_LABEL[getDepth(track.id, lesson.id)]}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">{lesson.minutes} 分钟</span>
                        {lesson.status === 'planned' && (
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-400">
                            仅大纲
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-sm leading-relaxed text-gray-600">{lesson.summary}</p>

                      <ul className="mt-3 space-y-1 text-xs text-gray-500">
                        {lesson.objectives.map((objective) => (
                          <li key={objective} className="flex gap-1.5">
                            <span className="text-gray-300">→</span>
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
