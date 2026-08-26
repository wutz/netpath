import { Link, createFileRoute } from '@tanstack/react-router'
import {
  DEPTH_LABEL,
  DEPTH_STYLE,
  KIND_LABEL,
  KIND_STYLE,
  LEVEL_CHIP,
  type PathItem,
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
 * 版式与 storpath / kubepath 对齐：框架段 → 入口卡 → 一段一张卡的阶梯 → 结尾一句话。
 * 每一段是一张卡，卡头带徽标、「第 N 步」、段标题与自己的进度；
 * 段里每一行课带标题和一句话说明，右侧最多一个标签加时长。
 *
 * 这里先后砍掉了两样东西：四个岗位标签（选岗位本身就是一道题），
 * 以及底下那个折叠的「全部课程」目录（路径已经是全集，同一批课列两遍只会让人怀疑
 * 两份清单不一样）。按主题读的入口没有丢 —— 每段卡头的标题就链到它所属的分类页。
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
          {stats.lessonCount} lessons · {stats.stageCount} stages · 约{' '}
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
        {path.stages.map(({ stage, items, minutes }, index) => (
          <Stage
            key={stage.id}
            step={index + 1}
            title={stage.title}
            hint={stage.hint}
            meta={`${items.length} 节 · ${minutes} 分钟`}
            items={items}
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
 * 一段就是一张卡。
 *
 * 徽标取这一段里出现最多的那个分类，段标题链到它的分类页 ——
 * 五个分类都能从这条路径上直接进去，不必再单列一份目录。
 */
function Stage({
  step,
  title,
  hint,
  meta,
  items,
  doneSet,
}: {
  step: number
  title: string
  hint: string
  meta: string
  items: PathItem[]
  doneSet: Set<string>
}) {
  const track = dominantTrack(items)
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
              <span className="eyebrow">第 {step} 步</span>
              <Link
                to="/tracks/$trackId"
                params={{ trackId: track.id }}
                className="text-[15px] font-semibold tracking-[-0.02em] hover:underline"
              >
                {title}
              </Link>
              <span className="font-mono text-[11px] text-mute">{meta}</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-body">{hint}</p>
          </div>
          <span className="shrink-0 font-mono text-xs text-mute">
            {done}/{items.length}
          </span>
        </div>
      </header>

      <ol className="divide-y divide-line">
        {items.map((item, index) => (
          <li key={item.key}>
            <Row item={item} index={index + 1} stageTrackId={track.id} doneSet={doneSet} />
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
  stageTrackId,
  doneSet,
}: {
  item: PathItem
  index: number
  stageTrackId: string
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
        <span className="block truncate text-sm text-ink">
          {/* 这一段里混进来的外分类课单独标出来，否则看不出它为什么排在这儿 */}
          {item.track.id !== stageTrackId && (
            <span className={`mr-1.5 ${LEVEL_CHIP}`}>{item.track.level}</span>
          )}
          {item.lesson.title}
        </span>
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

/** 这一段里出现最多的那个分类 —— 用来定卡头的徽标与标题链接 */
function dominantTrack(items: PathItem[]) {
  const count = new Map<string, number>()
  for (const item of items) count.set(item.track.id, (count.get(item.track.id) ?? 0) + 1)
  const winner = [...count.entries()].sort((a, b) => b[1] - a[1])[0][0]
  return items.find((item) => item.track.id === winner)!.track
}
