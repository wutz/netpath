import { Link, createFileRoute } from '@tanstack/react-router'
import {
  DEPTH_LABEL,
  DEPTH_STYLE,
  KIND_LABEL,
  KIND_STYLE,
  type PathItem,
  type Track,
  getDepth,
  learningPath,
  stats,
} from '#/lib/curriculum'
import { useProgress } from '#/lib/progress'

export const Route = createFileRoute('/')({
  component: Home,
})

/**
 * 首页就是那一条路径本身。
 *
 * 版式与 storpath / kubepath 对齐：框架段 → 入口卡 → 一步一张卡的阶梯 → 结尾一句话。
 *
 * 这里先后砍掉了三样东西：四个岗位标签（选岗位本身就是一道题）、
 * 底下那个折叠的「全部课程」目录（路径已经是全集，同一批课列两遍只会让人怀疑两份清单不一样），
 * 以及那层十七段的 stage 结构 —— 它让目录和路径各有一套顺序，两个事实来源要同步。
 * 现在**一步就是一个分类**，四步走完就是全部 49 节课，卡头直接链到分类页。
 */
function Home() {
  const progress = useProgress()
  const doneSet = new Set(progress.done)
  const path = learningPath
  const done = path.items.filter((item) => doneSet.has(item.key)).length
  const percent = path.lessonCount > 0 ? Math.round((done / path.lessonCount) * 100) : 0
  /** 沿这条线往下走的第一节没学完的课 */
  const resume = path.items.find((item) => !doneSet.has(item.key)) ?? path.items[0]

  return (
    <div className="space-y-10">
      <section>
        <div className="eyebrow">
          {stats.lessonCount} lessons · {stats.stepCount} steps · 约{' '}
          {Math.round(path.minutes / 60)} hours
        </div>
        <h1 className="display-2xl mt-3">{path.meta.tagline}</h1>
        <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-body">{path.meta.intro}</p>
      </section>

      <section className="rounded-lg bg-canvas px-5 py-5 shadow-soft sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="display-md">{done > 0 ? '继续学习' : '从第一节开始'}</h2>
          <span className="font-mono text-xs text-mute">
            已完成 {done}/{path.lessonCount}
          </span>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-soft-2">
            <div
              className="h-full rounded-full bg-brand-600 transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="font-mono text-[11px] text-mute">{percent}%</span>
        </div>
        {resume && (
          <Link
            to="/learn/$trackId/$lessonId"
            params={{ trackId: resume.track.id, lessonId: resume.lesson.id }}
            className="mt-5 inline-flex items-center rounded-sm bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
          >
            {done > 0 ? '接着学' : '开始学'} · 第 {resume.index} 节 {resume.lesson.title}
          </Link>
        )}
      </section>

      <section className="space-y-4">
        {path.steps.map(({ track, items, minutes }, index) => (
          <Step
            key={track.id}
            index={index + 1}
            track={track}
            items={items}
            minutes={minutes}
            doneSet={doneSet}
          />
        ))}

        <p className="text-sm leading-relaxed text-mute">
          顺序是建议不是限制 —— 已经有底子的话，直接跳到对应一段也行。想先动手，
          <Link
            to="/labs"
            className="text-ink underline decoration-line underline-offset-4 transition hover:decoration-ink"
          >
            实验与闯关
          </Link>
          把全部动手环节单独汇总在了一起。
        </p>
      </section>
    </div>
  )
}

/**
 * 一步就是一张卡 —— 一步等于一个分类，卡头链到它的分类页。
 */
function Step({
  index,
  track,
  items,
  minutes,
  doneSet,
}: {
  index: number
  track: Track
  items: PathItem[]
  minutes: number
  doneSet: Set<string>
}) {
  const done = items.filter((item) => doneSet.has(item.key)).length

  return (
    <article className="overflow-hidden rounded-md bg-canvas shadow-card">
      <header className="border-b border-line bg-soft px-4 py-3.5 sm:px-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 shrink-0 rounded-xs bg-canvas px-2 py-1 font-mono text-xs text-ink shadow-hair">
            {track.level}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="eyebrow">第 {index} 步</span>
              <Link
                to="/tracks/$trackId"
                params={{ trackId: track.id }}
                className="text-[15px] font-semibold tracking-[-0.02em] hover:underline"
              >
                {track.title}
              </Link>
              <span className="font-mono text-[11px] text-mute">
                {track.subtitle} · {items.length} 节 · {minutes} 分钟
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-body">{track.hint}</p>
          </div>
          <span className="shrink-0 font-mono text-xs text-mute">
            {done}/{items.length}
          </span>
        </div>
      </header>

      <ol className="divide-y divide-line">
        {items.map((item, i) => (
          <li key={item.key}>
            <Row item={item} index={i + 1} doneSet={doneSet} />
          </li>
        ))}
      </ol>
    </article>
  )
}

/** 一行课：序号、标题与一句话说明，右侧最多一个标签加时长 */
function Row({
  item,
  index,
  doneSet,
}: {
  item: PathItem
  index: number
  doneSet: Set<string>
}) {
  const isDone = doneSet.has(item.key)
  const depth = getDepth(item.track.id, item.lesson.id)
  /*
   * 标签位只留一个，密度和 storpath 对齐：动手环节优先（实验 / 闯关 / 规划），
   * 纯读的课如果标了「深入」就让它占这个位置 —— 那是「赶时间可以先跳过」的信号。
   */
  const tag =
    item.lesson.kind !== 'concept'
      ? { label: KIND_LABEL[item.lesson.kind], style: KIND_STYLE[item.lesson.kind] }
      : depth === 'deep'
        ? { label: DEPTH_LABEL.deep, style: DEPTH_STYLE.deep }
        : undefined

  return (
    <Link
      to="/learn/$trackId/$lessonId"
      params={{ trackId: item.track.id, lessonId: item.lesson.id }}
      className="flex items-center gap-3 px-4 py-3 transition hover:bg-soft sm:px-5"
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] ${
          isDone ? 'bg-brand-600 text-white' : 'bg-soft-2 text-mute'
        }`}
      >
        {isDone ? '✓' : index}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-ink">{item.lesson.title}</span>
        <span className="block truncate text-xs text-mute">{item.lesson.summary}</span>
      </span>
      {tag && (
        <span
          className={`hidden shrink-0 rounded-xs px-1.5 py-0.5 text-[11px] sm:inline ${tag.style}`}
        >
          {tag.label}
        </span>
      )}
      <span className="shrink-0 font-mono text-[11px] text-mute">{item.lesson.minutes}m</span>
    </Link>
  )
}
