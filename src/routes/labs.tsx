import { Link, createFileRoute } from '@tanstack/react-router'
import { allLessons, lessonKey, type LessonKind } from '#/lib/curriculum'
import { useProgress } from '#/lib/progress'

export const Route = createFileRoute('/labs')({
  component: LabsPage,
})

const SECTIONS: { kind: LessonKind; title: string; desc: string }[] = [
  {
    kind: 'quest',
    title: '命令行闯关',
    desc: '在模拟终端里接手一台或一套出问题的机器，按目标一步步把根因逼出来。',
  },
  {
    kind: 'lab',
    title: '动手实验',
    desc: '需要真实环境（虚拟机、K8s 测试集群或带 RDMA 网卡的机器），跟着步骤把链路打通。',
  },
  {
    kind: 'planner',
    title: '规划计算器',
    desc: '改参数看结果，把端口、交换机、线缆和收敛比的账算明白。',
  },
]

function LabsPage() {
  const progress = useProgress()
  const doneSet = new Set(progress.done)

  return (
    <div className="space-y-12">
      <header className="max-w-2xl">
        <h1 className="text-[26px] font-semibold leading-[1.2] tracking-[-0.035em] sm:text-[32px]">
          实验与闯关
        </h1>
        <p className="mt-3 leading-relaxed text-gray-600">
          网络知识点看过就忘，敲过命令才记得住。这里把全部动手环节汇总在一起，
          你可以脱离课程顺序直接来练。
        </p>
      </header>

      {SECTIONS.map((section) => {
        const items = allLessons.filter(({ lesson }) => lesson.kind === section.kind)
        if (!items.length) return null

        const sectionDone = items.filter(({ track, lesson }) =>
          doneSet.has(lessonKey(track.id, lesson.id)),
        ).length

        return (
          <section key={section.kind}>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-gray-200 pb-2.5">
              <h2 className="text-lg font-semibold tracking-tight">{section.title}</h2>
              <span className="font-mono text-[11px] text-gray-500">
                {items.length} 个 · 已完成 {sectionDone}
              </span>
            </div>
            <p className="mt-2.5 max-w-3xl text-sm leading-relaxed text-gray-600">
              {section.desc}
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {items.map(({ track, lesson }) => {
                const done = doneSet.has(lessonKey(track.id, lesson.id))
                return (
                  <Link
                    key={`${track.id}/${lesson.id}`}
                    to="/learn/$trackId/$lessonId"
                    params={{ trackId: track.id, lessonId: lesson.id }}
                    className="flex flex-col rounded-lg border border-gray-200 bg-white px-4 py-4 shadow-e2 transition hover:border-gray-300 hover:shadow-e3 sm:px-5"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-medium ${track.accent.bg} ${track.accent.text}`}
                      >
                        {track.level}
                      </span>
                      <span className="text-gray-500">{track.title}</span>
                      <span className="font-mono text-[11px] text-gray-500">
                        {lesson.minutes}m
                      </span>
                      {done && (
                        <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[11px] text-emerald-700">
                          已完成
                        </span>
                      )}
                      {lesson.status === 'planned' && (
                        <span className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[11px] text-gray-500">
                          仅大纲
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2.5 font-medium text-gray-900">{lesson.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{lesson.summary}</p>
                  </Link>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
