/**
 * 带出处署名的配图。
 *
 * 站内引用外部示意图时统一走这个组件 —— 图注和来源链接的位置固定，
 * 不给"忘了标出处"留余地。
 */
export function Figure({
  src,
  alt,
  caption,
  source,
  href,
}: {
  src: string
  alt: string
  caption?: string
  /** 出处名称，比如作者或站点 */
  source?: string
  /** 出处链接 */
  href?: string
}) {
  return (
    <figure className="my-6">
      <a
        href={href ?? src}
        target="_blank"
        rel="noreferrer"
        className="block overflow-hidden rounded-md bg-canvas shadow-card transition hover:shadow-float"
      >
        <img src={src} alt={alt} loading="lazy" className="block h-auto w-full" />
      </a>
      {(caption || source) && (
        <figcaption className="mt-2.5 text-xs leading-relaxed text-mute">
          {caption}
          {source && (
            <>
              {caption && ' '}
              <span>
                图片来源：
                {href ? (
                  <a href={href} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">
                    {source} ↗
                  </a>
                ) : (
                  source
                )}
              </span>
            </>
          )}
        </figcaption>
      )}
    </figure>
  )
}
