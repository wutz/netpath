import { type ReactNode } from 'react'
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
      <div className="rounded-lg bg-canvas px-6 py-12 text-center shadow-card">
        <p className="text-body">
          没有这个阶段：<span className="font-mono">{trackId}</span>
        </p>
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
  const percent = lessonCount > 0 ? Math.round((doneCount / lessonCount) * 100) : 0

  // 跨小组连续编号，回答"这个阶段我学到第几节了"
  let counter = 0

  return (
    <div className="space-y-8">
      <nav className="font-mono text-xs text-mute">
        <Link to="/" className="transition hover:text-ink">
          学习路径
        </Link>
        <span className="mx-1.5 text-line-strong">/</span>
        <span className="text-body">
          {track.level} {track.title}
        </span>
      </nav>

      {/*
        阶段头不再包卡 —— eyebrow 报代号，display-xl 报标题，
        进度和小组导航直接铺在页面上，与 storpath 的阶段页同一个骨架。
      */}
      <header>
        <div className="eyebrow">
          {track.level} · {track.subtitle}
        </div>
        <h1 className="display-xl mt-3">{track.title}</h1>
        <p className="mt-4 max-w-3xl text-[17px] leading-relaxed text-body">{track.goal}</p>

        <div className="mt-5 max-w-md">
          <div className="flex items-baseline justify-between font-mono text-[11px] text-mute">
            <span>
              {groups.length} 个小组 · {lessonCount} 节课 · 约 {Math.round(totalMinutes / 60)} 小时
            </span>
            <span>
              已完成 {doneCount}/{lessonCount}
            </span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-soft-2">
            <div
              className="h-full rounded-full bg-brand-600 transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* 小组导航：手机上一屏内就能看完整个阶段的结构 */}
        <div className="mt-5 flex flex-wrap gap-1.5">
          {groups.map(({ group, lessons }, index) => (
            <a
              key={group.id}
              href={`#${group.id}`}
              className="rounded-sm border border-line bg-canvas px-2.5 py-1 text-xs text-body transition hover:border-line-strong hover:text-ink"
            >
              <span className="font-mono text-mute">{index + 1}</span> {group.title}
              <span className="ml-1.5 font-mono text-mute">{lessons.length}</span>
            </a>
          ))}
        </div>
      </header>

      {groups.map(({ group, lessons, minutes, readyCount }, groupIndex) => {
        const groupDone = lessons.filter((l) => doneSet.has(lessonKey(track.id, l.id))).length

        return (
          <section key={group.id} id={group.id} className="space-y-3">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
              <span className="eyebrow">Section {groupIndex + 1}</span>
              <h2 className="display-sm">{group.title}</h2>
              <span className="font-mono text-[11px] text-mute">
                {lessons.length} 节 · {minutes} 分钟
                {readyCount < lessons.length && ` · 正文 ${readyCount}/${lessons.length}`}
                {groupDone > 0 && ` · 已完成 ${groupDone}`}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-body">{group.hint}</p>

            <ol className="space-y-3">
              {lessons.map((lesson) => {
                counter += 1
                const done = doneSet.has(lessonKey(track.id, lesson.id))
                const depth = getDepth(track.id, lesson.id)
                return (
                  <li key={lesson.id}>
                    <Link
                      to="/learn/$trackId/$lessonId"
                      params={{ trackId: track.id, lessonId: lesson.id }}
                      className="block rounded-md bg-canvas px-5 py-4 shadow-card transition hover:shadow-float sm:px-5"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Marker done={done}>{counter}</Marker>
                        <h3 className="display-sm">{lesson.title}</h3>
                        <span
                          className={`rounded-xs px-1.5 py-0.5 text-[11px] ${KIND_STYLE[lesson.kind]}`}
                        >
                          {KIND_LABEL[lesson.kind]}
                        </span>
                        {depth !== 'core' && (
                          <span
                            className={`rounded-xs px-1.5 py-0.5 text-[11px] ${DEPTH_STYLE[depth]}`}
                          >
                            {DEPTH_LABEL[depth]}
                          </span>
                        )}
                        <span className="font-mono text-[11px] text-mute">{lesson.minutes}m</span>
                        {lesson.status === 'planned' && (
                          <span className="rounded-xs bg-soft-2 px-1.5 py-0.5 text-[11px] text-mute">
                            仅大纲
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-sm leading-relaxed text-body">{lesson.summary}</p>

                      <ul className="mt-3 space-y-1 text-xs leading-relaxed text-mute">
                        {lesson.objectives.map((objective) => (
                          <li key={objective} className="flex gap-2">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-line-strong" />
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

/** 完成标记：做完的品牌色实心，没做的退到中性底 */
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
