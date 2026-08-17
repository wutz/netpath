import { HeadContent, Link, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { title: 'Netpath — 系统与集群网络成长路径' },
      {
        name: 'description',
        content:
          '系统网络的在线交互式学习项目：从 Linux 协议栈与报文路径出发，走过 K8s 容器网络、InfiniBand 与 RoCE 高性能网络，再到以太网与计算网的容量规划。',
      },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
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
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/85 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
            <Link to="/" className="flex shrink-0 items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
                N
              </span>
              <span className="text-base font-bold tracking-tight">Netpath</span>
              <span className="hidden text-xs text-gray-400 sm:inline">系统与集群网络路径</span>
            </Link>
            <nav className="-mr-1 flex items-center gap-0.5 overflow-x-auto text-sm [scrollbar-width:none] sm:gap-1 [&::-webkit-scrollbar]:hidden">
              <Link
                to="/"
                activeOptions={{ exact: true }}
                activeProps={{ className: 'bg-gray-100 text-gray-900' }}
                className="shrink-0 rounded-lg px-2.5 py-1.5 text-gray-600 transition hover:bg-gray-100 sm:px-3"
              >
                路径
              </Link>
              <Link
                to="/labs"
                activeProps={{ className: 'bg-gray-100 text-gray-900' }}
                className="shrink-0 rounded-lg px-2.5 py-1.5 text-gray-600 transition hover:bg-gray-100 sm:px-3"
              >
                实验与闯关
              </Link>
              <a
                href="https://storpath.wutz.dev/"
                target="_blank"
                rel="noreferrer"
                className="shrink-0 rounded-lg px-2.5 py-1.5 text-gray-600 transition hover:bg-gray-100 sm:px-3"
              >
                Storpath ↗
              </a>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-8">
          <Outlet />
        </main>

        <footer className="mt-12 border-t border-gray-200 bg-white sm:mt-16">
          <div className="mx-auto max-w-6xl px-3 py-6 text-xs text-gray-400 sm:px-4">
            <p>
              Netpath · 系统与集群网络成长路径。内容基于 k8s-in-action 部署手册、The Kubernetes
              Networking Guide、NVIDIA DGX SuperPOD 参考架构与 Systems Performance (2nd Edition)
              整理。
            </p>
            <p className="mt-1">学习进度保存在本地浏览器，换设备不同步。</p>
          </div>
        </footer>

        <Scripts />
      </body>
    </html>
  )
}
