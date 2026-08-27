/**
 * 大纲自检 —— `bun run check`。
 *
 * 课程顺序全靠 `groups[].lessons` 手写，改一次顺序很容易碰坏三件事：
 * 分组里引用了不存在的课、某节课漏进/重复进分组、`PREREQ` 指向了后面的课。
 * 最后一条尤其隐蔽：页面照样渲染，只是「建议先学」链到了读者还没走到的地方。
 */

import { PREREQ, learningPath, orderedLessons, stats, tracks } from '../src/lib/curriculum'

const problems: string[] = []

for (const track of tracks) {
  const grouped = track.groups.flatMap((g) => g.lessons)

  for (const group of track.groups) {
    for (const id of group.lessons) {
      if (!track.lessons.some((l) => l.id === id)) {
        problems.push(`分组 ${track.id}/${group.id} 引用了不存在的课程 ${id}`)
      }
    }
  }

  for (const lesson of track.lessons) {
    const times = grouped.filter((id) => id === lesson.id).length
    if (times === 0) problems.push(`${track.id}/${lesson.id} 没有进任何分组，不会出现在路径上`)
    if (times > 1) problems.push(`${track.id}/${lesson.id} 出现在 ${times} 个分组里`)
  }

  if (orderedLessons(track).length !== track.lessons.length) {
    problems.push(`${track.id} 的分组展开数与课程池数量对不上`)
  }
}

/** 每节课在整条路径上的序号，用来校验前置依赖不指向后面 */
const position = new Map(learningPath.items.map((item) => [item.key, item.index]))

for (const [key, deps] of Object.entries(PREREQ)) {
  const at = position.get(key)
  if (at === undefined) {
    problems.push(`PREREQ 里的 ${key} 不在路径上`)
    continue
  }
  for (const dep of deps) {
    const depAt = position.get(dep)
    if (depAt === undefined) {
      problems.push(`PREREQ ${key} 依赖了不存在的 ${dep}`)
    } else if (depAt >= at) {
      problems.push(`PREREQ 顺序倒挂：第 ${at} 节 ${key} 要求先学第 ${depAt} 节 ${dep}`)
    }
  }
}

if (problems.length > 0) {
  console.error(`大纲自检发现 ${problems.length} 处问题：`)
  for (const p of problems) console.error(`  · ${p}`)
  process.exit(1)
}

console.log(
  `大纲自检通过：${stats.trackCount} 个分类、` +
    `${tracks.reduce((n, t) => n + t.groups.length, 0)} 个小组、` +
    `${stats.lessonCount} 节课、${Object.keys(PREREQ).length} 条前置依赖。`,
)
