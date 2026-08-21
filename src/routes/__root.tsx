import { HeadContent, Link, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { title: 'Netpath — 网络运维工程师成长路径' },
      {
        name: 'description',
        content:
          '网络运维工程师的在线交互式学习项目：从 Linux 协议栈与报文路径出发，走过 K8s 容器网络、InfiniBand 与 RoCE 高性能网络，再到以太网与计算网的容量规划。',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/logo.svg', type: 'image/svg+xml' },
      /*
       * Geist / Geist Mono —— DESIGN.md 指定的两张字面。
       * Google Fonts 按 unicode-range 分片，中文命中不到 latin 子集，
       * 所以正文汉字仍走系统字体，不会为此多下字形。
       */
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap',
      },
    ],
  }),
  component: RootLayout,
})

function RootLayout() {
  return (
    <html lang="zh-CN">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-gray-50 font-sans text-gray-900 antialiased">
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/80 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-3 sm:h-16 sm:px-4">
            <Link to="/" className="flex shrink-0 items-center gap-2.5">
              <img src="/logo.svg" alt="" width={28} height={28} className="h-7 w-7 shrink-0" />
              <span className="text-[15px] font-semibold tracking-tight">Netpath</span>
              <span className="hidden border-l border-gray-200 pl-2.5 text-xs text-gray-500 sm:inline">
                网络运维工程师成长路径
              </span>
            </Link>
            <nav className="-mr-1 flex items-center gap-0.5 text-sm">
              <Link
                to="/"
                activeOptions={{ exact: true }}
                activeProps={{ className: '!bg-gray-100 !text-gray-900 font-medium' }}
                className="shrink-0 rounded-md px-2.5 py-1.5 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 sm:px-3"
              >
                路径
              </Link>
              <Link
                to="/labs"
                activeProps={{ className: '!bg-gray-100 !text-gray-900 font-medium' }}
                className="shrink-0 rounded-md px-2.5 py-1.5 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 sm:px-3"
              >
                实验与闯关
              </Link>
              <a
                href="https://wutz.dev/"
                target="_blank"
                rel="noreferrer"
                className="ml-1 shrink-0 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 sm:px-3"
              >
                wutz.dev <span className="text-gray-400">↗</span>
              </a>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-10">
          <Outlet />
        </main>

        <footer className="mt-16 border-t border-gray-200 bg-white sm:mt-24">
          <div className="mx-auto max-w-6xl px-3 py-10 sm:px-4">
            <div className="flex items-center gap-2.5">
              <img src="/logo.svg" alt="" width={20} height={20} className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium text-gray-900">Netpath</span>
              <span className="font-mono text-[11px] text-gray-500">
                网络运维工程师成长路径
              </span>
            </div>
            <p className="mt-4 max-w-3xl text-xs leading-relaxed text-gray-500">
              内容基于 k8s-in-action 部署手册、The Kubernetes Networking Guide、NVIDIA DGX SuperPOD
              参考架构与 Systems Performance (2nd Edition) 整理。
            </p>
            <p className="mt-1.5 text-xs text-gray-500">学习进度保存在本地浏览器，换设备不同步。</p>
          </div>
        </footer>

        <Scripts />
      </body>
    </html>
  )
}
