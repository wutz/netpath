/**
 * 课程大纲 —— 全站唯一数据源。
 * 路径图、阶段页、课程页、实验索引、进度统计都从这里派生。
 *
 * status: 'ready'   已有正文（src/content/<trackId>/<lessonId>.mdx）
 *         'planned' 仅有大纲，课程页会渲染大纲占位
 */

export type LessonKind = 'concept' | 'lab' | 'quest' | 'planner'
export type LessonStatus = 'ready' | 'planned'

export interface LessonRef {
  label: string
  /** 外部链接；本地仓库路径留空，按代码样式展示 */
  href?: string
  path?: string
}

export interface Lesson {
  id: string
  title: string
  summary: string
  kind: LessonKind
  status: LessonStatus
  /** 预计学习时长（分钟） */
  minutes: number
  /** 学完能做什么 */
  objectives: string[]
  /** 小节大纲 */
  outline: string[]
  refs?: LessonRef[]
}

/**
 * 阶段内的小组。
 *
 * 分组承担两件事：把「循序渐进」显式写出来，以及**定义学习顺序** ——
 * 全站的课程顺序由 groups[].lessons 决定，Track.lessons 只是课程池，顺序无关。
 * 想调整顺序只改这里，不用挪 Lesson 对象。
 */
export interface LessonGroup {
  id: string
  title: string
  /** 一句话说明这一组解决什么问题 */
  hint: string
  /** 本组课程 id，按学习顺序排列 */
  lessons: string[]
}

export interface Track {
  id: string
  level: string
  title: string
  subtitle: string
  goal: string
  /**
   * Tailwind 类名片段，用于阶段配色。
   *
   * 只用在小面积标记上 —— 阶段角标、圆点。大块卡片背景一律走中性色，
   * 否则六个阶段各铺一层浅色，整站就散成了一盒糖。
   */
  accent: {
    text: string
    bg: string
    border: string
    dot: string
  }
  groups: LessonGroup[]
  lessons: Lesson[]
}

export const KIND_LABEL: Record<LessonKind, string> = {
  concept: '原理',
  lab: '实验',
  quest: '闯关',
  planner: '规划',
}

/*
 * 课型标签。
 *
 * 原来四种课型各占一个色（灰/绿/黄/紫），和六个阶段的颜色叠在同一行里，
 * 一屏能出现十种色块，反而看不出哪个维度重要。现在只保留一处对比：
 * 「读」是中性灰，「动手」的三种（实验/闯关/规划）共用主题色 —— 这才是
 * 读者真正要区分的一件事。阶段色继续承担导航。
 */
export const KIND_STYLE: Record<LessonKind, string> = {
  concept: 'border-gray-200 bg-gray-50 text-gray-600',
  lab: 'border-brand-200 bg-brand-50 text-brand-700',
  quest: 'border-brand-200 bg-brand-50 text-brand-700',
  planner: 'border-brand-200 bg-brand-50 text-brand-700',
}

const REF_SYSPERF: LessonRef = { label: 'Systems Performance, 2nd Edition — Brendan Gregg' }
const REF_TKNG: LessonRef = { label: 'The Kubernetes Networking Guide', href: 'https://www.tkng.io/' }
const REF_SUPERPOD: LessonRef = {
  label: 'DGX SuperPOD H200 参考架构',
  href: 'https://docs.nvidia.com/dgx-superpod/reference-architecture/scalable-infrastructure-h200/latest/abstract.html',
}
const REF_NVLINK: LessonRef = {
  label: 'NVIDIA NVLink 与 NVLink Switch 规格',
  href: 'https://www.nvidia.com/en-us/data-center/nvlink/',
}
const REF_PCISIG: LessonRef = { label: 'PCI-SIG 规范总览', href: 'https://pcisig.com/specifications' }
const REF_STORPATH: LessonRef = { label: 'Storpath 存储运维成长路径', href: 'https://storpath.wutz.dev/' }
const REF_SSH_TUNNELS: LessonRef = {
  label: 'A Practical Guide to SSH Tunnels — Ivan Velichko (iximiuz Labs)',
  href: 'https://labs.iximiuz.com/tutorials/ssh-tunnels',
}
const REF_GOST: LessonRef = { label: 'GOST — GO Simple Tunnel', href: 'https://gost.run/' }
const REF_WIREGUARD: LessonRef = { label: 'WireGuard', href: 'https://www.wireguard.com/' }
const REF_TAILSCALE: LessonRef = { label: 'How Tailscale Works', href: 'https://tailscale.com/blog/how-tailscale-works' }
const REF_PRITUNL: LessonRef = { label: 'Pritunl', href: 'https://pritunl.com/' }
const REF_HAOEL: LessonRef = { label: '科学上网 — haoel', href: 'https://github.com/haoel/haoel.github.io' }
const REF_ANYTLS: LessonRef = { label: 'anytls-go', href: 'https://github.com/anytls/anytls-go' }
const REF_VERGE: LessonRef = { label: 'Clash Verge Rev', href: 'https://github.com/clash-verge-rev/clash-verge-rev' }
const repo = (path: string): LessonRef => ({ label: 'k8s-in-action', path })

export const tracks: Track[] = [
  {
    id: 'l0-basics',
    level: 'L0',
    title: '网络基础',
    subtitle: 'Linux 协议栈与观测',
    goal: '所有网络问题的地基。搞清一个包从应用到网线要经过哪些环节，每个环节能用什么命令看，以及延迟、带宽、PPS 三个指标各自受什么限制。',
    accent: {
      text: 'text-sky-700',
      bg: 'bg-sky-50',
      border: 'border-sky-200',
      dot: 'bg-sky-500',
    },
    groups: [
      {
        id: 'l0-start',
        title: '从这里开始',
        hint: '还没有实际排障经验就从这节起。一次 curl 串起全过程，把后面要用的名词一次性认全。',
        lessons: ['first-look'],
      },
      {
        id: 'l0-foundation',
        title: '打地基',
        hint: '先统一口径、再看清二三层怎么转发。这两节后面每一课都要用到，跳过去会处处别扭。',
        lessons: ['metrics-units', 'switching-routing'],
      },
      {
        id: 'l0-path',
        title: '走通一个包',
        hint: '沿着收发路径走一遍，再看 TCP 的实际行为和内核侧能动的旋钮。',
        lessons: ['packet-journey', 'tcp-behavior', 'kernel-stack'],
      },
      {
        id: 'l0-practice',
        title: '动手排障',
        hint: '把前面的知识收成一套固定的命令顺序，然后拿一个真实故障练手。',
        lessons: ['toolbox', 'quest-slow-host'],
      },
    ],
    lessons: [
      {
        id: 'first-look',
        title: '从一次 curl 说起：网络到底是什么',
        summary: '不谈调优、不谈参数。用一条命令把 DNS、TCP、TLS、HTTP 串起来，顺手把后面要用的名词认全。',
        kind: 'concept',
        status: 'ready',
        minutes: 25,
        objectives: [
          '说出一次 curl 背后依次发生的五件事，以及各自可能在哪一步失败',
          '认识 MAC / IP / 端口 / 网关 / DNS / MTU / RTT 这几个后面天天出现的名词',
          '知道自己该按哪条路线学下去，以及哪些内容现在可以先跳过',
        ],
        outline: [
          '一条命令的全过程：DNS → TCP 握手 → TLS → HTTP → 关闭',
          '每一步失败时的典型报错长什么样',
          '四个地址的分工：MAC、IP、端口、URL',
          '新人术语速查表：全站高频词一次认全',
          '亲手看一遍：curl -v 的每一行在说什么',
          '路线图：接下来学什么、什么可以先跳过',
        ],
        refs: [REF_SYSPERF],
      },
      {
        id: 'packet-journey',
        title: '一个包的旅程：从 send() 到网线',
        summary: '把发包和收包路径拆成可观测的若干段，后面所有排障都是在这条路径上定位。',
        kind: 'concept',
        status: 'ready',
        minutes: 30,
        objectives: [
          '说出发包路径上的关键环节：socket 缓冲、qdisc、驱动环形队列、DMA',
          '说出收包路径上的关键环节：DMA、硬中断、软中断/NAPI、协议栈、socket 队列',
          '拿到一个丢包现象时，知道该去哪一层查计数器',
        ],
        outline: [
          '为什么要先记住路径：故障永远发生在某一段',
          '发送路径：send() → socket sndbuf → TCP/IP → qdisc → 驱动 ring → 网线',
          '接收路径：网线 → DMA → 硬中断 → NAPI 软中断 → 协议栈 → recvbuf → read()',
          '每一段的观测手段与丢包计数器',
          '交互推演：选一个场景，逐跳看包走过哪里',
        ],
        refs: [REF_SYSPERF, repo('os/os.md')],
      },
      {
        id: 'metrics-units',
        title: '带宽、延迟、PPS：三个指标与必背换算',
        summary: 'Gbps 与 GB/s 差 8 倍，小包场景真正的瓶颈是 PPS 不是带宽。这节把口径统一。',
        kind: 'concept',
        status: 'ready',
        minutes: 25,
        objectives: [
          '在 Gbps、GB/s、PPS 之间快速换算，并算出线速下的理论 PPS',
          '判断一个场景到底受带宽限制还是受 PPS / 延迟限制',
          '用带宽延迟积（BDP）解释为什么长肥管道跑不满',
        ],
        outline: [
          'bit 与 Byte：网络用 bit 计，存储用 Byte 计',
          '线速 PPS：帧间隙与前导码带来的开销',
          '延迟的构成：串行化、传播、排队、处理',
          '带宽延迟积与 TCP 窗口',
          '小包场景：PPS 先撞墙，带宽还剩一半',
        ],
        refs: [REF_SYSPERF],
      },
      {
        id: 'switching-routing',
        title: '二层与三层：ARP、VLAN、子网与转发',
        summary: '交换机怎么决定往哪个口发，路由器怎么决定下一跳，以及同网段与跨网段的区别。',
        kind: 'concept',
        status: 'ready',
        minutes: 30,
        objectives: [
          '解释 ARP 的作用，并说出 ARP 表异常会造成什么现象',
          '看懂 CIDR 前缀，快速算出可用地址数与广播域大小',
          '读懂一台 Linux 主机的路由表并预测某个目的地址走哪条路',
        ],
        outline: [
          'MAC 学习与转发表：交换机的工作方式',
          'ARP 与 gARP：IP 到 MAC 的绑定',
          'VLAN 与广播域：802.1Q tag、trunk 与 access',
          'CIDR 与子网划分',
          'Linux 路由表：ip route / ip rule / 多路由表',
          '同网段直连 vs 跨网段经网关',
        ],
        refs: [REF_SYSPERF],
      },
      {
        id: 'tcp-behavior',
        title: 'TCP 的脾气：握手、窗口、拥塞与重传',
        summary: '为什么带宽没跑满却觉得慢？多半是窗口、重传和排队在起作用。',
        kind: 'concept',
        status: 'ready',
        minutes: 30,
        objectives: [
          '解释拥塞窗口、接收窗口、慢启动与拥塞避免的关系',
          '区分快速重传与超时重传，判断哪种对业务危害更大',
          '判断重传率、RTT、缓冲区膨胀（bufferbloat）三类症状',
        ],
        outline: [
          '三次握手与 backlog：连接建立阶段的两个队列',
          '接收窗口 vs 拥塞窗口，谁在限制发送',
          '慢启动、拥塞避免、Cubic 与 BBR',
          '丢包与重传：快速重传、SACK、RTO 超时',
          '排队延迟与 bufferbloat：延迟涨了但带宽还在',
          '用 ss -ti 读出一条连接的真实状态',
        ],
        refs: [REF_SYSPERF],
      },
      {
        id: 'kernel-stack',
        title: '内核网络栈调优：中断、队列与 offload',
        summary: '同一张网卡，配置对不对能差出几倍性能。这节讲能动的旋钮和动的理由。',
        kind: 'concept',
        status: 'ready',
        minutes: 35,
        objectives: [
          '解释 RSS / RPS / RFS 各自解决什么问题',
          '判断该不该开 GRO / LRO / TSO / checksum offload',
          '按症状选择调整环形队列、中断合并还是 CPU 亲和性',
        ],
        outline: [
          '硬中断、软中断与 NAPI 轮询',
          'RSS 多队列与网卡中断亲和性',
          'RPS / RFS：软件侧把包散到多核',
          'offload 家族：TSO、GSO、GRO、LRO、checksum',
          '环形队列与中断合并：ethtool -g / -c',
          '什么时候该动内核参数，什么时候该换方案（DPDK / RDMA）',
        ],
        refs: [REF_SYSPERF],
      },
      {
        id: 'toolbox',
        title: '网络观测工具箱：ss、ethtool、tcpdump、nstat',
        summary: '一套固定顺序的命令清单，让你在陌生机器上十分钟内摸清网络状态。',
        kind: 'concept',
        status: 'ready',
        minutes: 30,
        objectives: [
          '按接口、连接、协议栈、丢包四个维度各挑一条命令快速体检',
          '用 tcpdump 精确抓到目标流量而不是抓一堆无关包',
          '看懂 ethtool -S 和 nstat 里最常用的那几个计数器',
        ],
        outline: [
          '第一层：接口与链路（ip -s link、ethtool）',
          '第二层：连接与队列（ss -ti、ss -lnt）',
          '第三层：协议栈计数器（nstat、netstat -s、sar -n）',
          '第四层：抓包（tcpdump 过滤表达式、抓多长、怎么落盘）',
          '压测工具：iperf3、qperf、sockperf 各自的适用场景',
          '60 秒网络体检清单',
        ],
        refs: [REF_SYSPERF, repo('os/os.md')],
      },
      {
        id: 'quest-slow-host',
        title: '闯关：一台"网络慢"的机器',
        summary: '报障只有两个字"网慢"。在模拟终端里按路径逐层收敛，找出真正的原因。',
        kind: 'quest',
        status: 'ready',
        minutes: 25,
        objectives: [
          '面对模糊报障，按固定顺序收敛而不是乱猜',
          '从计数器里读出丢包发生在哪一层',
          '给出一个能验证的结论，而不是"网络有问题"',
        ],
        outline: [
          '目标一：确认链路本身是否正常',
          '目标二：确认是丢包还是排队',
          '目标三：定位丢包发生的层级',
          '目标四：给出根因与验证方法',
        ],
        refs: [REF_SYSPERF],
      },
    ],
  },
  {
    id: 'l5-tunnel',
    level: 'T',
    title: '代理与隧道',
    subtitle: '旁路工具箱 · 学完 L0 即可',
    goal: '工程师的日常工具箱：把内网服务安全地暴露给自己、把本地流量按规则送出去、把散落各处的机器组成一张网。它不在 L0→L4 那条主线上 —— 只依赖 L0 的基础，学完立刻能用，所以排在这里而不是压到最后。',
    accent: {
      text: 'text-teal-700',
      bg: 'bg-teal-50',
      border: 'border-teal-200',
      dot: 'bg-teal-500',
    },
    groups: [
      {
        id: 'l5-proxy',
        title: '代理与端口转发',
        hint: '两种代理的区别、ssh 的三把钥匙，以及 ssh 搞不定（UDP、长期穿透）时换成 gost。',
        lessons: ['proxy-basics', 'ssh-tunnels', 'ssh-advanced', 'gost-toolbox'],
      },
      {
        id: 'l5-vpn',
        title: 'VPN 组网',
        hint: '从两台机器的 WireGuard，到自动组网的 Tailscale，再到需要组织与审计时的 Pritunl。',
        lessons: ['wireguard', 'tailscale', 'pritunl'],
      },
      {
        id: 'l5-restricted',
        title: '受限网络实战',
        hint: '先诊断再动手：分清症状、看懂流量特征、写对分流规则，必要时做成网关。',
        lessons: ['restricted-network', 'traffic-shaping', 'clash-rules', 'transparent-gateway'],
      },
      {
        id: 'l5-quest',
        title: '排障',
        hint: '隧道昨天还好今天不通，从客户端一路查到出口。',
        lessons: ['quest-proxy-broken'],
      },
    ],
    lessons: [
      {
        id: 'proxy-basics',
        title: 'HTTP 代理与 SOCKS5：两种代理差在哪',
        summary: '一个懂 HTTP，一个只搬字节。搞清这点，配置里那些 http:// 与 socks5h:// 就不再靠猜。',
        kind: 'concept',
        status: 'ready',
        minutes: 30,
        objectives: [
          '说清正向代理、反向代理与透明代理三者的区别',
          '解释 HTTP CONNECT 隧道与普通 HTTP 代理的差异',
          '判断某个场景下域名该由本地还是代理侧解析（socks5 vs socks5h）',
        ],
        outline: [
          '正向 / 反向 / 透明：三种代理解决三类问题',
          'HTTP 代理：改写请求行，代理看得见 URL',
          'HTTP CONNECT：把代理变成字节管道，HTTPS 靠它',
          'SOCKS5：握手、认证、地址类型',
          'DNS 归属问题：socks5 与 socks5h 的一字之差',
          '环境变量约定：HTTP_PROXY / HTTPS_PROXY / NO_PROXY 与它们的坑',
          '哪些程序天生不认代理，怎么兜底',
        ],
        refs: [REF_HAOEL, REF_SSH_TUNNELS],
      },
      {
        id: 'ssh-tunnels',
        title: 'SSH 端口转发：-L、-R、-D 三把钥匙',
        summary: '不装任何软件，用手上已有的 ssh 打通绝大多数「我需要连到那台机器」的场景。',
        kind: 'lab',
        status: 'ready',
        minutes: 40,
        objectives: [
          '记住 -L / -R / -D 各自在哪一侧开监听端口',
          '用 -J 跳板机访问只监听 loopback 的远端服务',
          '解释 GatewayPorts 的作用以及为什么 -R 默认只绑 loopback',
        ],
        outline: [
          '一句话记法：左边那一侧开新端口',
          '本地转发 -L：把远端服务搬到本地端口',
          '经跳板机的本地转发：目标是第三台机器',
          '-J 与 -L 组合：访问远端自己的 loopback 端口',
          '远程转发 -R：把本地服务暴露到远端端口',
          '-R 到内网设备：家里的机器也能被访问',
          '动态转发 -D：本机变成 SOCKS5 代理',
          '动态远程转发：让 sshd 成为 SOCKS5 代理',
          '-f -N 与保活：让隧道能长期挂着',
        ],
        refs: [REF_SSH_TUNNELS, REF_HAOEL],
      },
      {
        id: 'ssh-advanced',
        title: 'SSH 进阶：ProxyJump、ProxyCommand 与配置固化',
        summary: '把一次能用的命令变成一劳永逸的配置，顺手解决多跳、复用与自动重连。',
        kind: 'concept',
        status: 'ready',
        minutes: 30,
        objectives: [
          '把多跳访问写进 ~/.ssh/config，之后只敲主机别名',
          '用 ProxyCommand 让 git、scp 也走代理',
          '用连接复用与自动重连让长期隧道稳定存活',
        ],
        outline: [
          '~/.ssh/config 的匹配规则与常用项',
          'ProxyJump 与老写法 ProxyCommand ssh -W 的关系',
          '让 git over ssh 走 SOCKS5：ProxyCommand nc -x',
          'ControlMaster 连接复用：第二次连接秒开',
          'ServerAliveInterval 与 TCPKeepAlive 的区别',
          'autossh 与 systemd unit：把隧道做成服务',
          '安全边界：AllowTcpForwarding、PermitOpen、专用低权限账号',
        ],
        refs: [REF_SSH_TUNNELS, REF_HAOEL],
      },
      {
        id: 'gost-toolbox',
        title: 'gost：一条命令搭出任意隧道',
        summary: '协议、传输、转发链三者自由组合。ssh 搞不定的形态，它基本都能拼出来。',
        kind: 'lab',
        status: 'ready',
        minutes: 35,
        objectives: [
          '用 -L 起代理服务、用 -F 串出多级转发链',
          '写出 TCP/UDP 端口转发与反向（rtcp）转发的命令',
          '按需求选传输层：裸 TCP、TLS、WebSocket、gRPC',
        ],
        outline: [
          '统一心智模型：Listener / Handler / Dialer / Connector',
          '-L 起服务：http、socks5、auto 多端口并存',
          '-F 转发链：按 -F 出现顺序逐跳走',
          '端口转发：-L tcp://:8080/目标:80',
          '反向转发 rtcp：让监听口开在链路对端',
          '换传输层抗干扰：wss、mwss、h2、grpc',
          'bypass 与分流：哪些目标不走隧道',
          '与 ssh 隧道的分工：什么时候该上 gost',
        ],
        refs: [REF_GOST, REF_HAOEL],
      },
      {
        id: 'wireguard',
        title: 'WireGuard：内核里的极简 VPN',
        summary: '不到 4000 行代码、一个 UDP 端口、两个密钥。现代 VPN 的地基几乎都建在它上面。',
        kind: 'lab',
        status: 'ready',
        minutes: 40,
        objectives: [
          '从零写出一对可用的 wg 配置并解释每一行',
          '说清 AllowedIPs 的双重含义，并据此排查单向不通',
          '算出该给 wg0 设多大的 MTU，并验证',
        ],
        outline: [
          '设计取舍：只有一套加密算法，没有协商',
          'Cryptokey Routing：公钥即身份，AllowedIPs 即路由',
          '生成密钥与最小可用配置',
          'wg-quick 帮你做了什么（以及它偷偷装的路由）',
          'MTU 账：封装开销与 1420 的来历',
          'NAT 后的一侧要 PersistentKeepalive',
          '子网路由与全流量出口（ip_forward + MASQUERADE）',
          '排障三件事：latest handshake、transfer、AllowedIPs',
        ],
        refs: [REF_WIREGUARD, REF_TAILSCALE],
      },
      {
        id: 'tailscale',
        title: 'Tailscale：WireGuard 网格与 NAT 穿透',
        summary: '同样是 WireGuard，为什么它不用你配任何 IP、开任何端口就能连上。',
        kind: 'concept',
        status: 'ready',
        minutes: 35,
        objectives: [
          '解释控制面与数据面分离的收益，说出协调服务器看不到什么',
          '说清 NAT 穿透失败时 DERP 中继接管的条件',
          '按需求选择 subnet router、exit node 还是逐机安装',
        ],
        outline: [
          '手工 WireGuard 全互联的成本：n 个节点要 n(n−1) 个端点',
          '控制面：公钥交换的「投递箱」，不碰流量',
          '身份外包给 IdP：不再维护第二套账号',
          'NAT 穿透：STUN / ICE，以及为什么不用 UPnP',
          'DERP 中继：什么时候降级、为什么它读不到内容',
          'ACL：中心定策略、每个节点自己执行',
          'subnet router 与 exit node：接入遗留网络',
          '与自建 WireGuard 的取舍：省的是运维，让出的是控制权',
        ],
        refs: [REF_TAILSCALE, REF_WIREGUARD],
      },
      {
        id: 'pritunl',
        title: 'Pritunl / OpenVPN：企业级 VPN 服务端',
        summary: '要的是组织、账号、审计和 SSO 时，装一套有管理界面的服务端比拼脚本划算。',
        kind: 'concept',
        status: 'ready',
        minutes: 30,
        objectives: [
          '说出 Pritunl 的架构与 MongoDB 在其中的角色',
          '规划组织、用户与服务器对象，给出路由与 DNS 方案',
          '判断该用 Pritunl、裸 OpenVPN 还是 Tailscale',
        ],
        outline: [
          '为什么还需要 OpenVPN：兼容性与既有客户端',
          'Pritunl 架构：Web 管理面 + MongoDB 协调 + 对等节点',
          '组织与用户模型，DNS 映射',
          'SSO 与 MFA：SAML / Okta / Entra / Duo / TOTP',
          '站点互联：gateway link、失效切换、mesh 与 hub-spoke',
          '高可用：多节点复制与跨可用区 VXLAN',
          '开源版与付费档的功能边界',
          '选型对照：Pritunl vs 裸 WireGuard vs Tailscale',
        ],
        refs: [REF_PRITUNL, REF_WIREGUARD],
      },
      {
        id: 'restricted-network',
        title: '受限网络下的技术访问：症状与选型',
        summary: '拉不下依赖、打不开文档时，先分清是 DNS、SNI、IP 还是限速，再决定用什么方案。',
        kind: 'concept',
        status: 'ready',
        minutes: 35,
        objectives: [
          '用命令区分 DNS 污染、连接重置、IP 不可达与单纯超时',
          '按团队条件在自建与订阅服务之间做出选择',
          '看懂线路标签并用 mtr 自己验证回程质量',
          '列出自建方案的必要组件与常见配置项',
        ],
        outline: [
          '四种典型症状与对应的验证命令',
          '判断树：先定位失败发生在哪一步',
          '开发者场景优先项：镜像源往往比隧道更稳',
          '自建 vs 订阅：成本、稳定性与可控性',
          '线路名词对照：CN2 GIA / CN2 GT / 163 / AS4837 / Eyeball',
          'VPS 选型：按价格与稳定性分档，以及各档适合什么用途',
          '验证方法：在 VPS 上反向 mtr 测回程，跨一个晚高峰再决定',
          '服务端基础：BBR、域名与证书、Docker 化部署',
          '开发者场景专项：apt/pip/npm/go/docker 各自怎么走代理',
          'Git 与容器镜像的代理配置',
          '合规与风险：只用于技术资料访问，不碰其它用途',
        ],
        refs: [
          REF_HAOEL,
          REF_GOST,
          { label: '搬瓦工 BandwagonHost（US · E-Commerce）', href: 'https://bwh8.net/' },
          { label: 'DMIT（US · Premium / Eyeball）', href: 'https://www.dmit.io/' },
          { label: 'CubeCloud（HK / US · CN2 GIA）', href: 'https://www.cubecloud.net/' },
          { label: 'CloudCone（US）', href: 'https://cloudcone.com/' },
        ],
      },
      {
        id: 'traffic-shaping',
        title: '流量特征与探测抵抗',
        summary: '为什么协议一直在演进：不是加密不够强，是「看起来像什么」不够自然。',
        kind: 'concept',
        status: 'ready',
        minutes: 30,
        objectives: [
          '解释 TLS in TLS 的指纹问题以及缓解思路',
          '说清连接复用与分包填充分别减少了什么可观测特征',
          '判断什么时候需要 CDN 前置',
        ],
        outline: [
          '可观测特征清单：握手指纹、包长分布、时序、端口',
          '嵌套 TLS 的问题：内层握手在外层里露出规律',
          'anytls 的三招：灵活分包、填充策略、连接复用',
          '主动探测与 probe_resist：把伪装页面做真',
          'CDN 前置：WebSocket 传输与端口限制',
          '原生 IP 与 WARP：被服务方风控时的另一类问题',
          '取舍：伪装度越高，延迟与复杂度越高',
        ],
        refs: [REF_ANYTLS, REF_HAOEL],
      },
      {
        id: 'clash-rules',
        title: '客户端与分流规则：Mihomo 配置',
        summary: '真正决定体验的不是节点，是规则：什么直连、什么走代理、DNS 交给谁。',
        kind: 'lab',
        status: 'ready',
        minutes: 35,
        objectives: [
          '读懂并改写一份 Mihomo/Clash 配置的关键段落',
          '设计一套「国内直连、技术站点走代理」的规则顺序',
          '判断该用系统代理还是 TUN 模式',
        ],
        outline: [
          '端口三兄弟：port / socks-port / mixed-port',
          'DNS 段：fake-ip 模式解决了什么问题',
          'proxy-groups：url-test、fallback、select 各自适用',
          'rules 的匹配顺序与最后的 MATCH',
          'GEOIP,CN,DIRECT 这一行背后的取舍',
          'TUN 模式 vs 系统代理：不认代理的程序怎么办',
          'Clash Verge Rev：订阅、规则可视化编辑与配置备份',
          '排查：从日志和连接面板确认某个请求走了哪条链',
        ],
        refs: [REF_VERGE, REF_HAOEL],
      },
      {
        id: 'transparent-gateway',
        title: '透明网关：让整个网段自动分流',
        summary: '不给每台设备装客户端，在网关上一次搞定 —— 包括那些没法配代理的设备。',
        kind: 'concept',
        status: 'ready',
        minutes: 35,
        objectives: [
          '用 iptables REDIRECT 把流量透明送进本地代理',
          '解释旁路由方案的原理与它的两个隐患',
          '在云上用 NAT 实例给整个子网做出口',
        ],
        outline: [
          '透明代理的前提：目标地址要能恢复',
          'iptables nat 链：RETURN 私网、REDIRECT 其余',
          '规则持久化：iptables-save 与开机恢复',
          '家用：路由器固件方案与树莓派旁路由',
          '云上：VPC 公私子网 + NAT 实例 + 路由表',
          'ip_forward 与 MASQUERADE 的必要性',
          'K8s 场景：节点 DNS 与 CoreDNS 转发配合',
          '风险控制：网关挂了整网断，要有回退路径',
        ],
        refs: [REF_HAOEL, repo('network/README.md')],
      },
      {
        id: 'quest-proxy-broken',
        title: '闯关：隧道昨天还好，今天不通了',
        summary: '在模拟终端里从「浏览器打不开」一路查到具体哪一跳断了。',
        kind: 'quest',
        status: 'ready',
        minutes: 30,
        objectives: [
          '按客户端 → 本地监听 → 隧道 → 出口逐段定位',
          '区分 DNS 失败、监听没起、隧道断开与出口被封',
          '给出可验证的结论与恢复步骤',
        ],
        outline: [
          '目标一：确认本地代理端口是否在监听',
          '目标二：确认隧道连接是否存活',
          '目标三：确认出口侧能否访问目标',
          '目标四：定位断点并说明修法',
        ],
        refs: [REF_GOST, REF_HAOEL],
      },
    ],
  },
  {
    id: 'l1-k8s',
    level: 'L1',
    title: '容器网络',
    subtitle: 'K8s 网络模型与 CNI',
    goal: '把 K8s 网络从"魔法"变成可推导的机制。Pod 之间怎么通、Service 的 VIP 是谁在翻译、流量从集群外进来经过哪几跳，全都能画出来。',
    accent: {
      text: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
    },
    groups: [
      {
        id: 'l1-model',
        title: '网络模型与数据平面',
        hint: '先看清 K8s 定下的四条约束，再用 ip 命令手搓一个满足它的最小网络，最后看各家 CNI 的取舍。',
        lessons: ['k8s-model', 'netns-veth', 'cni'],
      },
      {
        id: 'l1-service',
        title: 'Service 与南北流量',
        hint: '一个不存在的 IP 怎么工作、VIP 怎么让物理网络知道、L7 入口与 DNS 策略各在哪一层生效。',
        lessons: ['service', 'kube-proxy-ebpf', 'metallb', 'ingress-egress', 'dns-policy'],
      },
      {
        id: 'l1-extend',
        title: '扩展与排障',
        hint: '给 Pod 插第二张网卡，然后练一次「Pod 之间不通」。',
        lessons: ['secondary-cni', 'quest-pod-unreachable'],
      },
    ],
    lessons: [
      {
        id: 'netns-veth',
        title: '动手：用 netns 和 veth 手搓一个容器网络',
        summary: '不用 K8s、不用 Docker，纯 ip 命令把两个"容器"连通，容器网络就没有秘密了。',
        kind: 'lab',
        status: 'ready',
        minutes: 35,
        objectives: [
          '手工创建 netns、veth pair 和网桥，让两个命名空间互通',
          '解释容器出网为什么需要 SNAT',
          '在宿主机上找到某个 Pod 对应的 veth 和 netns',
        ],
        outline: [
          '网络命名空间：隔离了哪些东西',
          'veth pair：一根虚拟网线的两头',
          '接进网桥，配 IP，通了',
          '加默认路由与 SNAT，让它能出网',
          '回到 K8s：nsenter 进 Pod netns 排障',
        ],
        refs: [REF_TKNG, repo('network/README.md')],
      },
      {
        id: 'k8s-model',
        title: 'K8s 网络模型：四条铁律',
        summary: 'K8s 不实现网络，它只规定了几条必须满足的约束。理解约束，才能理解各家 CNI 的取舍。',
        kind: 'concept',
        status: 'ready',
        minutes: 25,
        objectives: [
          '复述 K8s 网络模型的强制约束，并解释它为什么排除了端口映射方案',
          '区分 Pod CIDR、Service CIDR、节点网段三套地址',
          '判断一个网络需求该由 CNI、Service 还是 Ingress 来满足',
        ],
        outline: [
          '四条铁律：Pod 独立 IP、免 NAT 互通、节点可达、看到的 IP 一致',
          '三套地址空间：节点网、Pod CIDR、Service CIDR',
          '东西流量与南北流量的分工',
          'CNI / Service / Ingress / NetworkPolicy 各管一段',
          '容量陷阱：Pod CIDR 划小了以后扩不了节点',
        ],
        refs: [REF_TKNG, repo('network/README.md'), repo('network/cilium/README.md')],
      },
      {
        id: 'cni',
        title: 'CNI 与数据平面：overlay、原生路由与 eBPF',
        summary: '同一个网络模型有三种实现路线，性能与运维复杂度差别很大。',
        kind: 'concept',
        status: 'ready',
        minutes: 35,
        objectives: [
          '解释 overlay（VXLAN/Geneve）与原生路由各自的代价',
          '说清 eBPF 数据平面比 iptables 快在哪里',
          '按机房条件（能否跑 BGP、MTU 是否可控）选 CNI 与模式',
        ],
        outline: [
          'CNI 规范：kubelet 到插件之间的一份约定',
          'overlay 模式：封装开销与 MTU 账',
          '原生路由模式：靠 BGP 或云路由表把 Pod CIDR 宣告出去',
          'eBPF 数据平面：绕过 iptables 与 conntrack',
          'Cilium 部署要点与踩过的坑（路由表冲突、Pod CIDR 扩容）',
          '次级 CNI：什么时候需要给 Pod 插第二张网卡',
        ],
        refs: [REF_TKNG, repo('network/cilium/README.md'), repo('network/kube-ovn/README.md')],
      },
      {
        id: 'service',
        title: 'Service：一个不存在的 IP 是怎么工作的',
        summary: 'ClusterIP ping 不通却能访问。把这件事讲透，Service 的四种类型就都通了。',
        kind: 'concept',
        status: 'ready',
        minutes: 35,
        objectives: [
          '解释 ClusterIP 为什么 ping 不通，以及 DNAT 发生在哪一侧',
          '区分 ClusterIP、NodePort、LoadBalancer、Headless 的适用场景',
          '说清 externalTrafficPolicy 与源 IP 保留之间的取舍',
        ],
        outline: [
          'Service 的本质：一条分布式的 DNAT 规则',
          'ClusterIP：客户端侧转换，VIP 没有实体',
          'NodePort：在 root netns 占一个静态端口',
          'LoadBalancer：裸金属上靠 MetalLB 用 ARP 或 BGP 宣告',
          'Headless：直接把 Pod IP 交给客户端自己处理',
          'externalTrafficPolicy: Local 的代价与收益',
          '交互推演：一个请求从客户端到 Pod 的完整跳数',
        ],
        refs: [REF_TKNG, repo('network/metallb/README.md')],
      },
      {
        id: 'metallb',
        title: 'MetalLB：裸金属集群的 LoadBalancer',
        summary: '云上一行 type: LoadBalancer 就有 VIP，裸金属得自己实现。两种宣告方式，选错了要么不通、要么只有高可用没有负载均衡。',
        kind: 'concept',
        status: 'ready',
        minutes: 35,
        objectives: [
          '解释 L2 模式下 VIP 是怎么被宣告与抢占的，以及为什么它只是高可用',
          '说清 BGP 模式的对等配置与 ECMP 分担，并据此在两种模式之间选择',
          '排查 VIP 不通时知道该看哪个 CRD、哪份日志、抓什么包',
        ],
        outline: [
          'Service 那节留下的问题：VIP 怎么让物理网络知道它的存在',
          'ARP 与 gARP：无请求应答式宣告，以及切换时怎么让全网更新缓存',
          'L2 模式：单节点承载全部流量，speaker 选主与故障接管',
          'BGP 基础：AS 号、对等会话、路由宣告',
          'BGP 模式：多节点宣告同一个 /32，靠 ECMP 真正分担',
          '两种模式对照：带宽上限、切换速度、对网络组的要求',
          '与 CNI 的配合：Cilium BGP 把 Pod CIDR 一起宣告出去',
          '地址池规划：从机房要一段可路由地址，且不能和节点网重叠',
          '排障四条路：servicel2statuses、speaker 日志、arping 反查、抓 ARP 包',
          '两个高频坑：externalTrafficPolicy 与 exclude-from-external-load-balancers 标签',
        ],
        refs: [
          repo('network/metallb/README.md'),
          repo('network/metallb/default-pool.yaml'),
          repo('network/cilium/README.md'),
          REF_TKNG,
        ],
      },
      {
        id: 'kube-proxy-ebpf',
        title: 'kube-proxy 的三代实现与 eBPF 替换',
        summary: 'iptables 模式在几千个 Service 时会退化。这节讲退化的原因和替代方案。',
        kind: 'concept',
        status: 'ready',
        minutes: 30,
        objectives: [
          '解释 iptables 模式的规则数量与匹配开销为何随 Service 数增长',
          '说清 IPVS 模式改善了什么、没改善什么',
          '判断是否该开 kubeProxyReplacement',
        ],
        outline: [
          'userspace → iptables → IPVS 的演进',
          'iptables 模式：线性匹配与规则同步风暴',
          'IPVS 模式：哈希表与调度算法',
          'eBPF 替换：socket 层直接改目的地址',
          'conntrack 表：容量、超时与常见告警',
          '迁移时要验证的几件事',
        ],
        refs: [REF_TKNG, repo('network/cilium/README.md')],
      },
      {
        id: 'ingress-egress',
        title: '南北流量：Ingress、Gateway API 与出口治理',
        summary: '流量从集群外进来的几种正规入口，以及出方向该不该管、怎么管。',
        kind: 'concept',
        status: 'ready',
        minutes: 30,
        objectives: [
          '说出 Ingress 与 Gateway API 的能力差异和迁移路径',
          '规划入口层：LB VIP、Ingress 控制器副本、证书从哪来',
          '给出限制 Pod 出网的两种做法及其代价',
        ],
        outline: [
          'Ingress API 与 Ingress Nginx 的位置',
          'Gateway API：角色分离与更强的路由能力',
          '证书：cert-manager 的签发与自动续期',
          'Egress：默认全放开的风险',
          'Egress Gateway 与固定出口 IP',
          '推理网关（Inference Gateway）这类新场景',
        ],
        refs: [
          REF_TKNG,
          repo('network/ingress-nginx/SKILL.md'),
          repo('network/istio/README.md'),
          repo('network/cert-manager/SKILL.md'),
        ],
      },
      {
        id: 'dns-policy',
        title: 'CoreDNS 与 NetworkPolicy',
        summary: '集群里一半的"网络故障"其实是 DNS；另一半是策略拦了没人知道。',
        kind: 'concept',
        status: 'ready',
        minutes: 25,
        objectives: [
          '解释 Pod 内 DNS 查询的完整过程与 ndots 带来的额外查询',
          '排查 CoreDNS 延迟与超时',
          '写出一条最小放行的 NetworkPolicy 并验证它生效',
        ],
        outline: [
          'Service 域名的四段结构与 search 域',
          'ndots:5 的副作用与解决办法',
          'CoreDNS 容量：副本数、缓存、autopath',
          'NetworkPolicy 的默认拒绝与白名单写法',
          '策略生效后如何验证（而不是靠猜）',
          'L7 策略与身份模型',
        ],
        refs: [REF_TKNG, repo('network/cilium/README.md')],
      },
      {
        id: 'secondary-cni',
        title: '动手：给 Pod 插第二张网卡',
        summary: 'AI 训练和虚拟机场景都需要 Pod 直连物理网。Multus、Spiderpool、MacVLAN 的实际配法。',
        kind: 'lab',
        status: 'ready',
        minutes: 35,
        objectives: [
          '用注解给 Pod 申请次级网卡与固定 IP 段',
          '解释 MacVLAN、IPvlan、SR-IOV 三种接入方式的差异',
          '判断什么场景必须 hostNetwork、什么场景该用 MacVLAN',
        ],
        outline: [
          'Multus 的工作方式与 NetworkAttachmentDefinition',
          'Spiderpool 的 IP 池管理与固定 IP',
          'MacvlanNetwork + nv-ipam 实战配置',
          'kube-ovn 作为次级 CNI 给虚拟机用',
          'hostNetwork 与 MacVLAN 的取舍：端口冲突 vs 配置复杂度',
        ],
        refs: [
          repo('network/network-operator/macvlan/README.md'),
          repo('network/spiderpool/'),
          repo('network/kube-ovn/SKILL.md'),
        ],
      },
      {
        id: 'quest-pod-unreachable',
        title: '闯关：Pod 之间不通',
        summary: '同一个 Service 有些副本能访问、有些不行。在模拟终端里一层层剥开。',
        kind: 'quest',
        status: 'ready',
        minutes: 30,
        objectives: [
          '按 Pod → 节点 → CNI → Service → 策略的顺序收敛问题',
          '区分 DNS 失败、策略拦截、路由缺失三类症状',
          '定位到具体节点或具体规则，而不是停在"网络不通"',
        ],
        outline: [
          '目标一：确认是 DNS 还是连通性',
          '目标二：确认 Endpoint 是否正常',
          '目标三：确认跨节点路由与隧道状态',
          '目标四：确认是否被 NetworkPolicy 拦截',
        ],
        refs: [REF_TKNG],
      },
    ],
  },
  {
    id: 'l2-hpc',
    level: 'L2',
    title: '高性能网络',
    subtitle: '机内互联与 RDMA 网络',
    goal: 'AI 训练与高性能存储的主战场。先看清机内：PCIe 拓扑决定网卡能不能跑满、NVLink 决定 GPU 之间有多快；再看机间：RDMA 为什么快、无损以太网靠什么撑住，以及怎么把一条链路从网卡打通到 NCCL 跑出正常带宽。',
    accent: {
      text: 'text-violet-700',
      bg: 'bg-violet-50',
      border: 'border-violet-200',
      dot: 'bg-violet-500',
    },
    groups: [
      {
        id: 'l2-intra',
        title: '机内互联',
        hint: 'PCIe 决定网卡能不能跑满，NVLink 决定 GPU 之间有多快。机间网络的账建立在这两笔账之上，所以先看机内。',
        lessons: ['pcie-topology', 'nvlink'],
      },
      {
        id: 'l2-rdma',
        title: 'RDMA 原理',
        hint: '为什么快、IB 与 RoCE 差在哪，以及无损以太网到底靠什么撑住。',
        lessons: ['why-rdma', 'infiniband', 'roce'],
      },
      {
        id: 'l2-handson',
        title: '打通一条链路',
        hint: '先在两台裸机之间跑出线速，再把 RDMA 交给容器。原理讲完就动手，别等到最后。',
        lessons: ['perftest', 'k8s-rdma'],
      },
      {
        id: 'l2-collective',
        title: '集群拓扑与集合通信',
        hint: '拓扑决定 AllReduce 能跑多快，而 busbw 是验收整条链路的唯一指标。',
        lessons: ['topology-rail', 'nccl', 'quest-slow-allreduce'],
      },
    ],
    lessons: [
      {
        id: 'pcie-topology',
        title: 'PCIe：机内的那张网',
        summary: 'PCIe 不是总线而是一张交换网。槽位插错、代际不对，400G 网卡只能跑出一半。',
        kind: 'concept',
        status: 'ready',
        minutes: 35,
        objectives: [
          '按代际与 lane 数算出一条 PCIe 链路的可用带宽，并判断它够不够喂满某张网卡',
          '用 lspci 与 nvidia-smi topo 读出实际协商结果与设备间的拓扑关系',
          '说出 GPUDirect 对 PCIe 拓扑与 ACS 的要求',
        ],
        outline: [
          'PCIe 是点对点交换网：Root Complex、Switch、Endpoint、lane',
          '带宽账：每代每 lane 多少，x8 与 x16 差多少',
          '关键换算：400G 网卡需要 Gen5 x16，Gen4 x16 喂不满',
          '单向还是双向：报价单上最常见的 2 倍误差',
          '协商结果核对：LnkCap 与 LnkSta 不一致就是降速',
          '拓扑与亲和：PIX / PXB / PHB / NODE / SYS 五个等级',
          'NUMA：跨 socket 访问的额外代价',
          'ACS 与 IOMMU：为什么开着 ACS 时 P2P 会退化',
          'bifurcation 与共享槽位：物理 x16 不代表电气 x16',
        ],
        refs: [REF_PCISIG, REF_SUPERPOD, REF_SYSPERF],
      },
      {
        id: 'nvlink',
        title: 'NVLink 与 NVSwitch：机内的 GPU 高速网',
        summary: 'GPU 之间走 PCIe 太慢，于是有了另一张网。搞清它的边界在哪，才知道哪些流量会上机间网络。',
        kind: 'concept',
        status: 'ready',
        minutes: 35,
        objectives: [
          '说出各代 NVLink 的单卡带宽与链路数，并把它和 PCIe、机间网络放在同一把尺子上比',
          '解释 NVSwitch 让 8 卡全带宽互联的原理，以及 NVL72 把域扩到 72 卡意味着什么',
          '用 nvidia-smi 读出 NVLink 状态与吞吐，判断某条链路是否掉了',
        ],
        outline: [
          '为什么不能用 PCIe：带宽差一个数量级',
          '各代规格：链路数 × 单链路带宽 = 单卡总带宽',
          '双向聚合口径：和网络的「每方向每端口」不是一把尺子',
          'NVSwitch：从直连 mesh 到全互联',
          'NVLink 域的边界：8 卡、72 卡，以及域外必须走网络',
          '带宽层级全景：HBM → NVLink → PCIe → 机间网络',
          '并行策略如何贴合这个层级（张量并行留在域内）',
          'NVLink SHARP：在交换机里做归约',
          '观测与排障：nvidia-smi nvlink 的状态、计数器与掉链症状',
        ],
        refs: [REF_NVLINK, REF_SUPERPOD],
      },
      {
        id: 'why-rdma',
        title: '为什么需要 RDMA：内核旁路与零拷贝',
        summary: '同样的 100Gbps 网卡，TCP 与 RDMA 的延迟差一个数量级。差在哪里，代价是什么。',
        kind: 'concept',
        status: 'ready',
        minutes: 30,
        objectives: [
          '说清 TCP 路径上哪几步被 RDMA 省掉了',
          '解释 QP、CQ、MR、Verbs 这几个基本概念',
          '判断一个业务该不该上 RDMA',
        ],
        outline: [
          '先算账：100Gbps 下 TCP 要花多少 CPU',
          '内核旁路与零拷贝：省掉的三次拷贝和两次上下文切换',
          'RDMA 的基本对象：QP、CQ、MR、PD',
          '单边操作与双边操作：WRITE/READ vs SEND/RECV',
          '三种传输：IB、RoCEv2、iWARP',
          'RDMA 的代价：无损要求、内存注册、排障门槛',
        ],
        refs: [REF_SYSPERF, repo('network/network-operator/README.md'), REF_STORPATH],
      },
      {
        id: 'infiniband',
        title: 'InfiniBand 架构：子网管理器、LID 与 UFM',
        summary: 'IB 不是"快一点的以太网"，它是另一套体系：地址、路由、拥塞控制全都自成一家。',
        kind: 'concept',
        status: 'ready',
        minutes: 35,
        objectives: [
          '解释 SM 的作用，说出 SM 失效会发生什么',
          '区分 LID 与 GID，并读懂 ibstat / ibstatus 输出',
          '用 ibdiagnet 之类的工具做一次链路体检',
        ],
        outline: [
          '架构总览：HCA、交换机、SM、路由算法',
          'LID 与 GID：二层与三层寻址',
          '链路层流控：credit 机制天生无损',
          '自适应路由与拥塞控制',
          'UFM：管理平面与告警',
          '常用命令：ibstat、iblinkinfo、ibdiagnet、show_gids',
        ],
        refs: [REF_SUPERPOD, repo('network/network-operator/README.md')],
      },
      {
        id: 'roce',
        title: 'RoCEv2 与无损以太网：PFC、ECN 与 DCQCN',
        summary: '把 RDMA 跑在以太网上，全部难点集中在一件事：不能丢包。',
        kind: 'concept',
        status: 'ready',
        minutes: 40,
        objectives: [
          '解释 PFC 与 ECN 的分工，说出只配一个会怎样',
          '看懂 PFC 风暴与死锁的形成条件',
          '列出交换机与主机两侧必须对齐的配置项',
        ],
        outline: [
          'RoCEv2 报文结构：UDP 4791 与它的含义',
          '为什么 RDMA 受不了丢包：go-back-N 的代价',
          'PFC：按优先级反压，以及它的副作用',
          'ECN 与 DCQCN：端到端降速才是主力',
          '优先级映射：DSCP / PCP / TC 必须端到端一致',
          '主机侧配置：mlnx_qos、trust mode、GID 选择',
          '验收清单：怎么证明这套无损网真的无损',
        ],
        refs: [
          repo('network/network-operator/README.md'),
          repo('ai/nccl-tests/config-reference.md'),
          REF_SUPERPOD,
        ],
      },
      {
        id: 'topology-rail',
        title: 'Fat-Tree 与 Rail-Optimized 拓扑',
        summary: 'GPU 集群的网络拓扑不是"接上就行"，接错了 AllReduce 直接掉一半带宽。',
        kind: 'concept',
        status: 'ready',
        minutes: 30,
        objectives: [
          '画出两层 Fat-Tree 并算出它的无阻塞条件',
          '解释 rail-optimized 布线为什么能让同 rail 通信只走一跳',
          '说清 NVLink 域与网络域的边界在哪',
        ],
        outline: [
          'Fat-Tree / Spine-Leaf：为什么它成了事实标准',
          '无阻塞与收敛比：上行下行端口账',
          'Rail-Optimized：每张网卡对应一个 rail',
          '同 rail 一跳，跨 rail 走 spine',
          'NVLink 与网络的分工：机内 vs 机间',
          '按 SU 布线：宁可留空位也要把 leaf 接满',
        ],
        refs: [REF_SUPERPOD],
      },
      {
        id: 'perftest',
        title: '动手：用 perftest 打通第一条 RDMA 链路',
        summary: 'ib_send_bw 跑不出线速时，问题几乎总在 GID、设备名或 MTU 上。',
        kind: 'lab',
        status: 'ready',
        minutes: 35,
        objectives: [
          '用 show_gids 选对 GID index 并解释为什么要选',
          '跑 ib_send_bw / ib_write_lat 并判读结果是否合格',
          '按结果区分是链路问题、配置问题还是拓扑问题',
        ],
        outline: [
          '环境检查：ibstat、ibdev2netdev、rdma link',
          'GID 表与 RoCEv2 条目的挑选',
          'ib_send_bw：带宽基线测试',
          'ib_write_lat：延迟基线测试',
          '结果判读：与理论线速对比的合格线',
          '常见失败：设备名写错、GID 选错、MTU 不一致、PFC 未生效',
        ],
        refs: [repo('network/network-operator/README.md')],
      },
      {
        id: 'k8s-rdma',
        title: '动手：K8s 里把 RDMA 交给 Pod',
        summary: 'network-operator、rdma/hca 资源、hostNetwork 与 MacVLAN 两种模式的实际配法。',
        kind: 'lab',
        status: 'ready',
        minutes: 40,
        objectives: [
          '部署 network-operator 并用 NicClusterPolicy 暴露 rdma/hca 资源',
          '按 IB 或 RoCE 场景写对 Pod 的资源与网络配置',
          '在 Pod 内验证 RDMA 设备可用并跑通带宽测试',
        ],
        outline: [
          '依赖：NFD 与 DOCA OFED 驱动',
          'NicClusterPolicy 与 rdma-shared-device-plugin',
          'IB 场景：申请 rdma/hca 即可',
          'RoCE 场景：hostNetwork: true 的原因',
          'MacVLAN 模式：MacvlanNetwork + nv-ipam IP 池',
          'Pod 内验证：show_gids 与 ib_send_bw 对打',
        ],
        refs: [
          repo('network/network-operator/README.md'),
          repo('network/network-operator/macvlan/README.md'),
        ],
      },
      {
        id: 'nccl',
        title: '动手：NCCL 与 busbw 判读',
        summary: 'AllReduce 的 busbw 是 GPU 集群的网络体检报告。这节讲怎么跑、怎么读、怎么调。',
        kind: 'lab',
        status: 'ready',
        minutes: 40,
        objectives: [
          '跑通多节点 all_reduce_perf 并确认正确性检查通过',
          '用 2(n-1)/n 校正因子把 busbw 与硬件峰值对比',
          '按机型配对 NCCL_IB_HCA、NCCL_SOCKET_IFNAME 等关键变量',
        ],
        outline: [
          '集合通信原语：AllReduce、AllGather、ReduceScatter',
          'Ring 与 Tree 算法，以及为什么测试要固定算法',
          '关键环境变量与选错的后果',
          '单次扫描测试 vs 固定尺寸压测',
          'busbw 与 algbw 的区别，校正因子怎么用',
          '合格线：≥ 理论峰值 90%，低于 80% 要查',
        ],
        refs: [
          repo('ai/nccl-tests/quickstart.md'),
          repo('ai/nccl-tests/config-reference.md'),
        ],
      },
      {
        id: 'quest-slow-allreduce',
        title: '闯关：AllReduce 只有理论值一半',
        summary: '两节点 16 卡，busbw 卡在一半上不去。在模拟终端里查出它到底走没走 RDMA。',
        kind: 'quest',
        status: 'ready',
        minutes: 30,
        objectives: [
          '从 NCCL 日志判断走的是 RDMA 还是 TCP',
          '核对 GID、HCA 名称与网卡速率是否符合预期',
          '定位到一处具体配置错误并说明修法',
        ],
        outline: [
          '目标一：确认测试结果与理论峰值的差距',
          '目标二：确认 NCCL 实际选用的网络通道',
          '目标三：核对 RDMA 设备与链路状态',
          '目标四：找出配置错误并给出修正',
        ],
        refs: [repo('ai/nccl-tests/config-reference.md')],
      },
    ],
  },
  {
    id: 'l3-planning',
    level: 'L3',
    title: '网络规划',
    subtitle: '以太网与高性能网络',
    goal: '把业务需求翻译成端口数、交换机数、线缆数和地址段。以太网算收敛比与接入账，高性能网络算 rail、SU 与无阻塞条件。',
    accent: {
      text: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
    },
    groups: [
      {
        id: 'l3-require',
        title: '把需求变成数字',
        hint: '业务话术里没有一个可以拿去采购的数字，先问出来。',
        lessons: ['requirements'],
      },
      {
        id: 'l3-eth',
        title: '以太网这一套',
        hint: '端口账与收敛比，加上一次性决定、长期后悔的地址规划。',
        lessons: ['ethernet-plan', 'ip-plan'],
      },
      {
        id: 'l3-fabric',
        title: '计算网这一套',
        hint: 'Rail 布线账，以及最后那道 IB / RoCE / Spectrum-X 的选型题。',
        lessons: ['fabric-plan', 'ib-vs-roce'],
      },
    ],
    lessons: [
      {
        id: 'requirements',
        title: '需求拆解：从业务话术到端口和带宽',
        summary: '"我们要建个 AI 集群"这句话里没有一个可采购的数字。这节讲怎么问出来。',
        kind: 'concept',
        status: 'ready',
        minutes: 25,
        objectives: [
          '用一份清单把模糊需求问成可计算的参数',
          '区分必须独立成网与可以共用的流量类型',
          '识别报价单里最容易被漏掉的项',
        ],
        outline: [
          '要问清的六件事：规模、增长、流量类型、可用性、预算、机房条件',
          '四张网的划分：业务/管理/存储/计算',
          '机房约束：机柜功率、走线距离、光模块类型',
          '容易漏项：光模块、DAC/AOC、备件、管理交换机',
          '把结论写成一页可评审的规划表',
        ],
        refs: [REF_SUPERPOD, REF_STORPATH],
      },
      {
        id: 'ethernet-plan',
        title: '以太网规划：Spine-Leaf 端口账与收敛比',
        summary: '给定节点数和网卡规格，算出需要几台 leaf、几台 spine、多少线缆、收敛比多少。',
        kind: 'planner',
        status: 'ready',
        minutes: 35,
        objectives: [
          '独立算出一套 Spine-Leaf 的交换机数量与线缆数量',
          '解释收敛比的含义并判断某个取值是否可接受',
          '看出配置里真正的瓶颈资源在哪一层',
        ],
        outline: [
          '接入层账：节点数 × 每节点端口数 ÷ 每台 leaf 可用下行口',
          '上行账：leaf 上行带宽与下行带宽之比就是收敛比',
          'spine 台数：由 leaf 上行口数决定',
          '常见取值：存储 1:1、通用业务 3:1、办公接入更高也无妨',
          '冗余：双上行、双归属与 MLAG',
          '规划计算器：改参数看结果',
        ],
        refs: [REF_SUPERPOD, REF_STORPATH],
      },
      {
        id: 'ip-plan',
        title: '地址与 VLAN 规划：给集群划地盘',
        summary: '地址规划是一次性决定、长期后悔的事。Pod CIDR 划小了以后加不了节点。',
        kind: 'concept',
        status: 'ready',
        minutes: 30,
        objectives: [
          '按节点数与单节点 Pod 数上限反推 Pod CIDR 大小',
          '规划节点网、Service CIDR、LB 地址池不重叠',
          '给出一份可交给网络组执行的 VLAN 与网段表',
        ],
        outline: [
          '三套地址的关系与不可重叠约束',
          'Pod CIDR：per-node block size 与总量的账',
          'Service CIDR：够用就好，改不了',
          'LB 地址池：从机房要一段可路由地址',
          'VLAN 划分与管理网隔离',
          '预留：给扩容留出连续地址段',
        ],
        refs: [repo('network/cilium/README.md'), repo('network/metallb/default-pool.yaml')],
      },
      {
        id: 'fabric-plan',
        title: '高性能网络规划：SU、Rail 与线缆账',
        summary: '按 GPU 数算出计算网的 leaf/spine 台数与线缆数，并核对无阻塞条件。',
        kind: 'planner',
        status: 'ready',
        minutes: 40,
        objectives: [
          '按 rail-optimized 原则算出交换机与线缆数量',
          '核对两层 Fat-Tree 的无阻塞条件是否成立',
          '把结果与 DGX SuperPOD 参考架构的数字对上',
        ],
        outline: [
          '输入参数：GPU 数、每节点 GPU/网卡、端口速率、交换机端口数',
          'Rail 数 = 每节点计算网卡数',
          'leaf 台数与每 rail 的节点上限',
          'spine 台数与 spine-leaf 线缆数',
          '无阻塞校验：上行容量 ≥ 下行容量',
          '与参考架构核对：1 SU = 32 节点，8 leaf + 4 spine',
          '存储网与管理网另算',
        ],
        refs: [REF_SUPERPOD],
      },
      {
        id: 'ib-vs-roce',
        title: '选型对比：IB、RoCE 与 Spectrum-X',
        summary: '同一笔预算三种方案，差别不在峰值带宽，在运维成本和确定性。',
        kind: 'concept',
        status: 'ready',
        minutes: 30,
        objectives: [
          '按团队能力与规模给出一个能落地的选型建议',
          '说出三种方案在拥塞控制上的本质差异',
          '列出各方案的隐性成本',
        ],
        outline: [
          '性能维度：带宽、延迟、尾延迟',
          '运维维度：谁来配 PFC/ECN，谁来管 SM',
          '生态维度：驱动、监控、故障定位工具',
          'Spectrum-X：以太网 + 自适应路由的折中',
          '成本账：交换机、光模块、许可、人力',
          '决策树：三个问题定方案',
        ],
        refs: [REF_SUPERPOD, repo('ai/nccl-tests/config-reference.md')],
      },
    ],
  },
  {
    id: 'l4-advanced',
    level: 'L4',
    title: '进阶专题',
    subtitle: '加速、卸载与协议',
    goal: '按需取用的专题库。每个专题回答三个问题：它解决什么问题、代价是什么、什么场景下真的需要它。',
    accent: {
      text: 'text-rose-700',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      dot: 'bg-rose-500',
    },
    groups: [
      {
        id: 'l4-fastpath',
        title: '绕开常规数据路径',
        hint: '从把网卡切给容器，到把逻辑塞进内核，再到干脆自己轮询。三种做法由浅入深，代价也依次变大。',
        lessons: ['sriov-macvlan', 'ebpf-xdp', 'dpdk'],
      },
      {
        id: 'l4-domain',
        title: 'GPU 与存储专项',
        hint: '把 L2 的 RDMA 知识往上接：显存直通、远端盘、集合通信库，以及卸载到卡上的趋势。',
        lessons: ['gpudirect', 'nvme-of', 'mpi', 'dpu'],
      },
      {
        id: 'l4-ops',
        title: '长期运维',
        hint: '把前面所有东西变成看板、告警，和别人能照着执行的流程。',
        lessons: ['observability', 'oncall'],
      },
    ],
    lessons: [
      {
        id: 'sriov-macvlan',
        title: 'SR-IOV、MacVLAN 与 IPvlan：把网卡切给容器',
        summary: '三种让容器贴近物理网的方式，性能与灵活度各有取舍。',
        kind: 'concept',
        status: 'ready',
        minutes: 30,
        objectives: [
          '解释 PF 与 VF 的关系以及 VF 数量的限制',
          '区分 MacVLAN、IPvlan、SR-IOV 在数据路径上的差异',
          '按场景选出合适的接入方式并说出它的代价',
        ],
        outline: [
          '为什么要绕开常规 CNI 数据路径',
          'MacVLAN：一张卡多个 MAC，交换机侧要允许',
          'IPvlan：共用 MAC，适合限制 MAC 数量的环境',
          'SR-IOV：硬件级切分，VF 直通进容器',
          '与 RDMA 的组合：VF + rdma/hca',
          '取舍表：性能、隔离、可迁移性、运维复杂度',
        ],
        refs: [
          repo('network/network-operator/macvlan/README.md'),
          repo('network/network-operator/README.md'),
        ],
      },
      {
        id: 'ebpf-xdp',
        title: 'eBPF 与 XDP：把逻辑塞进内核路径',
        summary: '从 Cilium 到网络可观测性，eBPF 已经是容器网络的默认答案。',
        kind: 'concept',
        status: 'ready',
        minutes: 35,
        objectives: [
          '说出 eBPF 程序可以挂在网络路径的哪些钩子上',
          '解释 XDP 为什么能做到线速丢包',
          '判断一个需求该用 eBPF 还是传统方案',
        ],
        outline: [
          'eBPF 基础：程序、map、verifier',
          '网络钩子：XDP、tc、socket、cgroup',
          'XDP 三种模式与线速处理',
          '典型应用：负载均衡、DDoS 过滤、可观测性',
          'Cilium 如何用 eBPF 替掉 kube-proxy',
          '调试手段与限制',
        ],
        refs: [REF_SYSPERF, repo('network/cilium/README.md')],
      },
      {
        id: 'dpdk',
        title: 'DPDK：用户态轮询与大页内存',
        summary: '把网卡从内核手里抢过来自己轮询，换来极低延迟和整核的 CPU 占用。',
        kind: 'concept',
        status: 'ready',
        minutes: 30,
        objectives: [
          '解释轮询模式驱动为什么比中断快',
          '列出 DPDK 的部署前提与资源代价',
          '判断该选 DPDK 还是 XDP 还是 RDMA',
        ],
        outline: [
          'PMD 轮询模式驱动与内核旁路',
          '大页内存、CPU 独占与 NUMA 亲和',
          'UIO / VFIO 设备绑定',
          '典型场景：网关、NFV、交易系统',
          '代价：网卡被独占、常规工具全部失效',
          '与 XDP、RDMA 的对比',
        ],
        refs: [REF_SYSPERF],
      },
      {
        id: 'gpudirect',
        title: 'GPUDirect RDMA 与 GPUDirect Storage',
        summary: '让网卡直接读写显存，把 CPU 和主存彻底从数据路径上摘掉。',
        kind: 'concept',
        status: 'ready',
        minutes: 30,
        objectives: [
          '画出开启与未开启 GPUDirect RDMA 时的数据路径差异',
          '列出生效的前提条件（驱动、PCIe 拓扑、ACS）',
          '验证 GPUDirect 是否真的生效',
        ],
        outline: [
          '未开启时的路径：显存 → 主存 → 网卡',
          '开启后的路径：网卡 ↔ 显存直通',
          '前提：nvidia-peermem、PCIe 同 switch、ACS 关闭',
          'PCIe 拓扑与 NIC-GPU 亲和',
          'GPUDirect Storage：NVMe 直读显存',
          '验证方法与常见失效原因',
        ],
        refs: [REF_SUPERPOD, repo('network/network-operator/README.md')],
      },
      {
        id: 'nvme-of',
        title: 'NVMe-oF：把 NVMe 协议搬到网络上',
        summary: '远端盘做到接近本地盘的延迟，靠的是不做协议转换。',
        kind: 'concept',
        status: 'ready',
        minutes: 30,
        objectives: [
          '区分 NVMe/RDMA、NVMe/TCP、NVMe/FC 三种传输',
          '解释 NVMe-oF 相比 iSCSI 的延迟优势来自哪里',
          '完成一次 discover 与 connect 并确认多路径',
        ],
        outline: [
          'NVMe 队列模型与 iSCSI 的差别',
          '三种 fabric：RDMA、TCP、FC',
          'NQN、subsystem、namespace 概念',
          'nvme discover / connect 实操',
          '多路径与故障切换',
          '与本地盘、Ceph RBD 的性能对比口径',
        ],
        refs: [REF_STORPATH],
      },
      {
        id: 'mpi',
        title: 'MPI 与集合通信：谁在真正搬数据',
        summary: 'MPI 在 AI 训练里常常只是个启动器，真正的通信由 NCCL 完成。搞清分工才能调对。',
        kind: 'concept',
        status: 'ready',
        minutes: 30,
        objectives: [
          '说清 MPI 与 NCCL 在 AI 训练里的分工',
          '看懂 mpirun 常用参数对性能的影响',
          '排查 hcoll 与 NCCL 冲突这类初始化失败',
        ],
        outline: [
          'MPI 基础：rank、communicator、集合操作',
          'OpenMPI 与 UCX 的分层',
          'mpirun 关键参数：-np、-bind-to、-x',
          'MPI 只做启动器的场景',
          'hcoll 与 NCCL 抢同一条路的典型报错',
          '与 Kubeflow Trainer / MPIJob 的结合',
        ],
        refs: [repo('ai/nccl-tests/config-reference.md')],
      },
      {
        id: 'dpu',
        title: 'DPU 与 Spectrum-X：把网络卸载到卡上',
        summary: '交换机和网卡开始跑自己的操作系统。这对运维意味着多了一层要管的东西。',
        kind: 'concept',
        status: 'ready',
        minutes: 25,
        objectives: [
          '说出 DPU 能卸载哪些工作以及收益来源',
          '解释 Spectrum-X 用什么手段接近 IB 的确定性',
          '判断当前规模是否值得引入 DPU',
        ],
        outline: [
          'DPU 的组成：ARM 核 + 网络引擎 + 加速器',
          '可卸载的工作：虚拟交换、加密、存储协议、策略',
          'BlueField 的两种模式',
          'Spectrum-X：自适应路由与拥塞控制',
          '运维影响：卡上也要打补丁、也会出故障',
          '什么规模开始值得考虑',
        ],
        refs: [REF_SUPERPOD, repo('ai/nccl-tests/config-reference.md')],
      },
      {
        id: 'observability',
        title: '网络可观测性：指标、流日志与抓包',
        summary: '把"网络好不好"变成可以画在看板上、能告警的具体数字。',
        kind: 'concept',
        status: 'ready',
        minutes: 30,
        objectives: [
          '列出必须采集的网络指标及其告警阈值',
          '用流量可见性工具定位一次跨服务调用失败',
          '设计一套在故障时真的能用的抓包流程',
        ],
        outline: [
          '主机侧指标：丢包、重传、队列、PPS',
          '网卡与交换机侧：PFC 计数、ECN 标记、端口错误',
          'RDMA 专属计数器怎么看',
          '流量可见性：Hubble 与 conntrack 视角',
          '抓包工程化：什么时候抓、抓多少、存哪里',
          '看板设计：先看什么后看什么',
        ],
        refs: [repo('o11y/'), repo('network/cilium/README.md')],
      },
      {
        id: 'oncall',
        title: '网络值班手册：SOP 与容量复盘',
        summary: '把前面所有知识固化成别人也能照着执行的流程，这才是工程师的产出物。',
        kind: 'concept',
        status: 'ready',
        minutes: 25,
        objectives: [
          '写出一份别人能照着执行的网络故障处置 SOP',
          '主持一次不追责的网络故障复盘',
          '建立变更前的检查清单与回滚方案',
        ],
        outline: [
          '常见告警的处置 SOP 模板',
          '分层排障法：从 CLI 到看板到抓包',
          '变更管理：窗口、双人复核、回滚',
          '故障复盘：时间线、根因、改进项',
          '容量复盘：端口用尽与地址用尽的提前量',
        ],
      },
    ],
  },
]

/* ---------- 前置依赖 ---------- */

/**
 * 建议先学的课程：`${trackId}/${lessonId}` → 前置课程 key 列表。
 *
 * 集中放在一处而不是散在每个 Lesson 上，是为了能一眼看完整张依赖图。
 * 只记「跳过会看不懂」的强依赖，同组相邻的自然顺序不重复登记。
 */
export const PREREQ: Record<string, string[]> = {
  // L0：地图 → 地基 → 路径 → 行为与调优 → 排障
  'l0-basics/metrics-units': ['l0-basics/first-look'],
  'l0-basics/switching-routing': ['l0-basics/first-look'],
  'l0-basics/packet-journey': ['l0-basics/switching-routing'],
  'l0-basics/tcp-behavior': ['l0-basics/packet-journey', 'l0-basics/metrics-units'],
  'l0-basics/kernel-stack': ['l0-basics/packet-journey'],
  'l0-basics/toolbox': ['l0-basics/packet-journey'],
  'l0-basics/quest-slow-host': ['l0-basics/toolbox'],

  // L1：模型 → 数据平面 → Service
  'l1-k8s/cni': ['l1-k8s/k8s-model', 'l0-basics/switching-routing'],
  'l1-k8s/service': ['l1-k8s/k8s-model'],
  'l1-k8s/kube-proxy-ebpf': ['l1-k8s/service'],
  'l1-k8s/metallb': ['l1-k8s/service', 'l0-basics/switching-routing'],
  'l1-k8s/ingress-egress': ['l1-k8s/service', 'l1-k8s/metallb'],
  'l1-k8s/quest-pod-unreachable': ['l1-k8s/cni', 'l1-k8s/service', 'l1-k8s/dns-policy'],

  // L2：机内 → 原理 → 动手 → 集合通信
  'l2-hpc/pcie-topology': ['l0-basics/metrics-units'],
  'l2-hpc/why-rdma': ['l0-basics/packet-journey'],
  'l2-hpc/roce': ['l2-hpc/why-rdma', 'l0-basics/tcp-behavior'],
  'l2-hpc/perftest': ['l2-hpc/roce'],
  'l2-hpc/k8s-rdma': ['l2-hpc/perftest', 'l1-k8s/secondary-cni'],
  'l2-hpc/nccl': ['l2-hpc/topology-rail', 'l2-hpc/nvlink'],
  'l2-hpc/quest-slow-allreduce': ['l2-hpc/nccl', 'l2-hpc/pcie-topology'],

  // L3：规划全都建立在前面的账上
  'l3-planning/ethernet-plan': ['l0-basics/metrics-units'],
  'l3-planning/ip-plan': ['l1-k8s/k8s-model'],
  'l3-planning/fabric-plan': ['l2-hpc/topology-rail', 'l2-hpc/nvlink'],
  'l3-planning/ib-vs-roce': ['l2-hpc/infiniband', 'l2-hpc/roce'],

  // L4：进阶专题各自接在对应的基础课后面
  'l4-advanced/sriov-macvlan': ['l1-k8s/cni'],
  'l4-advanced/ebpf-xdp': ['l1-k8s/cni', 'l0-basics/kernel-stack'],
  'l4-advanced/dpdk': ['l0-basics/kernel-stack'],
  'l4-advanced/gpudirect': ['l2-hpc/pcie-topology', 'l2-hpc/why-rdma'],
  'l4-advanced/nvme-of': ['l2-hpc/why-rdma'],
  'l4-advanced/mpi': ['l2-hpc/nccl'],
  'l4-advanced/dpu': ['l2-hpc/roce'],
  'l4-advanced/observability': ['l0-basics/toolbox'],

  // T 代理与隧道：旁路分支，只依赖组内顺序和 L0 的基础
  'l5-tunnel/ssh-tunnels': ['l5-tunnel/proxy-basics'],
  'l5-tunnel/ssh-advanced': ['l5-tunnel/ssh-tunnels'],
  'l5-tunnel/gost-toolbox': ['l5-tunnel/proxy-basics'],
  'l5-tunnel/wireguard': ['l0-basics/switching-routing'],
  'l5-tunnel/tailscale': ['l5-tunnel/wireguard'],
  'l5-tunnel/pritunl': ['l5-tunnel/wireguard'],
  'l5-tunnel/clash-rules': ['l5-tunnel/proxy-basics', 'l5-tunnel/restricted-network'],
  'l5-tunnel/transparent-gateway': ['l5-tunnel/clash-rules'],
  'l5-tunnel/quest-proxy-broken': ['l5-tunnel/gost-toolbox', 'l5-tunnel/clash-rules'],
}

/* ---------- 难度标记 ---------- */

export type LessonDepth = 'intro' | 'core' | 'deep'

/**
 * 只标注两端：`intro` 是零经验也能读，`deep` 是可以先跳过、遇到具体问题再回来。
 * 没登记的默认 `core`，界面上不显示徽章，避免每节课都挂标签。
 */
export const DEPTH: Record<string, LessonDepth> = {
  'l0-basics/first-look': 'intro',
  'l0-basics/metrics-units': 'intro',
  'l0-basics/switching-routing': 'intro',
  'l0-basics/kernel-stack': 'deep',
  'l1-k8s/k8s-model': 'intro',
  'l1-k8s/kube-proxy-ebpf': 'deep',
  'l2-hpc/pcie-topology': 'deep',
  'l2-hpc/nvlink': 'deep',
  'l2-hpc/infiniband': 'deep',
  'l2-hpc/roce': 'deep',
  'l2-hpc/topology-rail': 'deep',
  'l2-hpc/nccl': 'deep',
  'l3-planning/requirements': 'intro',
  'l4-advanced/ebpf-xdp': 'deep',
  'l4-advanced/dpdk': 'deep',
  'l4-advanced/gpudirect': 'deep',
  'l4-advanced/nvme-of': 'deep',
  'l4-advanced/mpi': 'deep',
  'l4-advanced/dpu': 'deep',
  'l4-advanced/oncall': 'intro',
  'l5-tunnel/proxy-basics': 'intro',
  'l5-tunnel/ssh-tunnels': 'intro',
  'l5-tunnel/traffic-shaping': 'deep',
}

export const DEPTH_LABEL: Record<LessonDepth, string> = {
  intro: '入门',
  core: '',
  deep: '深入',
}

/* 深浅只是难度提示，标签文字本身已经说清楚了，不再另给颜色 */
export const DEPTH_STYLE: Record<LessonDepth, string> = {
  intro: 'border-gray-200 bg-gray-50 text-gray-500',
  core: '',
  deep: 'border-gray-200 bg-gray-50 text-gray-500',
}

export function getDepth(trackId: string, lessonId: string): LessonDepth {
  return DEPTH[`${trackId}/${lessonId}`] ?? 'core'
}

/* ---------- 岗位路线 ---------- */

/** 路线里的一段，把一条长清单切成看得懂的几步 */
export interface RoleStage {
  title: string
  /** 一句话说明这一段解决什么 */
  hint: string
  /** 课程 key，按学习顺序排列 */
  lessons: string[]
}

export interface RolePath {
  id: string
  /** 岗位名 */
  title: string
  /** 同一类岗位的其它叫法 */
  alias: string
  /** 一句话点出这个岗位的处境 */
  tagline: string
  /** 这条线为什么这么排 */
  desc: string
  /** 走完能做什么 */
  outcome: string[]
  stages: RoleStage[]
}

/**
 * 按岗位切四条主线。
 *
 * 54 节课平铺出来没人知道从哪下手，而"零经验新手"这个身份太笼统 ——
 * 架构师需要的是算账与选型，运维需要的是排障手感，两者的必修课重叠不到一半。
 * 所以按岗位裁剪：每条线只保留这个岗位真正会用到的课，并切成几段推进。
 *
 * 四条线都从 L0 起步（术语和指标是共同地基），之后分叉。
 * 网络运维那条覆盖最广 —— 这张网整个是他的地盘 —— 但仍然是裁剪过的，
 * 机内互联、GPU 专项与那些加速卸载专题都不在上面。
 */
export const ROLE_PATHS: RolePath[] = [
  {
    id: 'architect',
    title: '解决方案架构师',
    alias: '方案工程师 · 售前',
    tagline: '客户要的是一份能落地、也能报价的方案',
    desc:
      '你不必亲手敲每一条命令，但必须听得懂需求背后的数字：端口、收敛比、rail 数、线缆根数。' +
      '这条线把动手排障的部分压到最少，重点放在技术底牌与规划算账，最后补上方案里绕不开的几个配套话题。',
    outcome: [
      '把「要跑千卡训练」翻译成 rail 数、交换机台数与光模块数量',
      '在 IB、RoCE 与 Spectrum-X 之间说清各自的代价，而不是只报品牌',
      '看一眼现有拓扑就知道哪一层会先成为瓶颈',
    ],
    stages: [
      {
        title: '术语与数字',
        hint: '先把指标口径统一，谈方案时才不会被带偏',
        lessons: [
          'l0-basics/first-look',
          'l0-basics/metrics-units',
          'l0-basics/switching-routing',
        ],
      },
      {
        title: '高性能网络的技术底牌',
        hint: '知道每种互联快在哪、代价是什么',
        lessons: [
          'l2-hpc/why-rdma',
          'l2-hpc/pcie-topology',
          'l2-hpc/nvlink',
          'l2-hpc/infiniband',
          'l2-hpc/roce',
          'l2-hpc/topology-rail',
        ],
      },
      {
        title: '把需求写成端口数与线缆数',
        hint: '这条线的主课，两个计算器都在这一段',
        lessons: [
          'l3-planning/requirements',
          'l3-planning/ethernet-plan',
          'l3-planning/ip-plan',
          'l3-planning/fabric-plan',
          'l3-planning/ib-vs-roce',
        ],
      },
      {
        title: '方案绕不开的配套',
        hint: '客户一定会问的几件事：容器平台、存储直通、卸载方案',
        lessons: [
          'l1-k8s/k8s-model',
          'l4-advanced/gpudirect',
          'l4-advanced/nvme-of',
          'l4-advanced/dpu',
        ],
      },
    ],
  },
  {
    id: 'compute-ops',
    title: '集群运维工程师',
    // 标题去掉了"计算"二字，GPU / AI 这个场景挪到副标题里点明
    alias: '服务工程师 · GPU 集群交付',
    tagline: '集群交付之后，出事第一个被找的是你',
    desc:
      '这条线偏手上功夫：先能把「网络慢」定位到具体一层，再吃透 K8s 容器网络那套看似魔法的机制，' +
      '最后打通网卡到 NCCL 的整条链路。AI 集群的报障绝大多数落在这三段里，四个闯关也都排进来了。',
    outcome: [
      '接到「训练变慢了」，能一路查到是网卡、交换机还是 NCCL 参数',
      '讲清 Pod 到 Pod 的每一跳，并知道每跳用什么命令看',
      '用 perftest 与 nccl-tests 给出「链路正不正常」的量化结论',
    ],
    stages: [
      {
        title: '排障基本功',
        hint: 'L0 全部，最后一节是闯关：一台「网络慢」的机器',
        lessons: [
          'l0-basics/first-look',
          'l0-basics/metrics-units',
          'l0-basics/packet-journey',
          'l0-basics/switching-routing',
          'l0-basics/tcp-behavior',
          'l0-basics/toolbox',
          'l0-basics/quest-slow-host',
        ],
      },
      {
        title: '上手就用的远程工具',
        hint: '跳板机后面的集群怎么连，第一周就会用到',
        lessons: ['l5-tunnel/ssh-tunnels', 'l5-tunnel/ssh-advanced'],
      },
      {
        title: 'K8s 容器网络',
        hint: '从四条铁律推到 Service 与 DNS，收尾是 Pod 不通的闯关',
        lessons: [
          'l1-k8s/k8s-model',
          'l1-k8s/cni',
          'l1-k8s/service',
          'l1-k8s/dns-policy',
          'l1-k8s/quest-pod-unreachable',
        ],
      },
      {
        title: 'GPU 集群的高速链路',
        hint: '从 PCIe 亲和一路打到 busbw 判读',
        lessons: [
          'l2-hpc/pcie-topology',
          'l2-hpc/why-rdma',
          'l2-hpc/roce',
          'l2-hpc/perftest',
          'l2-hpc/k8s-rdma',
          'l2-hpc/nccl',
          'l2-hpc/quest-slow-allreduce',
        ],
      },
      {
        title: '长期值班',
        hint: '把一次性的排查沉淀成指标与 SOP',
        lessons: ['l4-advanced/observability', 'l4-advanced/oncall'],
      },
    ],
  },
  {
    id: 'storage-ops',
    title: '存储运维工程师',
    alias: '分布式存储 · 数据平台',
    tagline: '存储的瓶颈，多半不在盘上',
    desc:
      '存储流量是长连接、大包、对丢包和抖动最敏感的一类流量，问题往往出在网络侧。' +
      '这条线先补主机侧的收发路径与内核栈，再看 RDMA 与无损以太网怎么撑住 NVMe-oF 和 GPUDirect Storage，' +
      '最后是存储网段怎么划、怎么直通进容器。',
    outcome: [
      '说清一次读写请求在主机侧经过哪些队列，哪一段最容易堆积',
      '判断存储网该走 TCP 还是 RDMA，并说清 RoCE 无损配置的代价',
      '给存储网划好独立网段，并把它直通到 Pod 里',
    ],
    stages: [
      {
        title: '从主机侧看存储流量',
        hint: '内核栈那一节对存储尤其关键：中断、队列与 offload',
        lessons: [
          'l0-basics/first-look',
          'l0-basics/metrics-units',
          'l0-basics/switching-routing',
          'l0-basics/packet-journey',
          'l0-basics/tcp-behavior',
          'l0-basics/kernel-stack',
          'l0-basics/toolbox',
          'l0-basics/quest-slow-host',
        ],
      },
      {
        title: '存储走 RDMA 之后',
        hint: 'NVMe-oF 与 GDS 的底座，都压在 RoCE 这一层上',
        lessons: [
          'l2-hpc/why-rdma',
          'l2-hpc/roce',
          'l2-hpc/perftest',
          'l4-advanced/nvme-of',
          'l4-advanced/gpudirect',
        ],
      },
      {
        title: '存储网怎么划',
        hint: '独立网段、独立 VLAN，以及接入层的收敛比该留多少',
        lessons: ['l3-planning/ip-plan', 'l3-planning/ethernet-plan'],
      },
      {
        title: '接进容器平台',
        hint: '把存储网直通给 Pod，绕开 overlay 那一层封装',
        lessons: [
          'l1-k8s/k8s-model',
          'l4-advanced/sriov-macvlan',
          'l1-k8s/secondary-cni',
          'l4-advanced/observability',
        ],
      },
    ],
  },
  {
    id: 'net-ops',
    title: '网络运维工程师',
    alias: '网络工程师 · 数据中心网络',
    tagline: '这张网整个是你的地盘，从接入口一直到 spine',
    desc:
      '四条线里覆盖最广的一条：转发与 TCP 行为要吃透，代理、VPN 与透明网关是日常工具，' +
      'K8s 那层 overlay 要能看穿，RoCE 的无损配置要会调，最后还得出得了规划、值得了班。' +
      '仍然是裁剪过的 —— 机内互联（PCIe / NVLink）、GPU 专项与那些加速卸载专题都不在上面。',
    outcome: [
      '任何一段"不通"或"变慢"，都能定位到具体某一跳、某一层',
      '把内网服务、跨地域机器与整个网段的出口流量安排妥当',
      '看穿容器那层封装：Service 的 VIP、Ingress 的入口与 overlay 的每一跳',
    ],
    stages: [
      {
        title: '协议栈与转发',
        hint: 'L0 全部八节，这条线的其余部分都建在这上面',
        lessons: [
          'l0-basics/first-look',
          'l0-basics/metrics-units',
          'l0-basics/switching-routing',
          'l0-basics/packet-journey',
          'l0-basics/tcp-behavior',
          'l0-basics/kernel-stack',
          'l0-basics/toolbox',
          'l0-basics/quest-slow-host',
        ],
      },
      {
        title: '远程接入与隧道',
        hint: '日常工具箱：端口转发、组网、企业 VPN 与整网段分流',
        lessons: [
          'l5-tunnel/proxy-basics',
          'l5-tunnel/ssh-tunnels',
          'l5-tunnel/ssh-advanced',
          'l5-tunnel/gost-toolbox',
          'l5-tunnel/wireguard',
          'l5-tunnel/tailscale',
          'l5-tunnel/pritunl',
          'l5-tunnel/transparent-gateway',
          'l5-tunnel/quest-proxy-broken',
        ],
      },
      {
        title: '容器网络这层封装',
        hint: '从手搓 netns 到 MetalLB 与 Ingress，L1 基本整段吃下',
        lessons: [
          'l1-k8s/netns-veth',
          'l1-k8s/k8s-model',
          'l1-k8s/cni',
          'l1-k8s/service',
          'l1-k8s/metallb',
          'l1-k8s/kube-proxy-ebpf',
          'l1-k8s/ingress-egress',
          'l1-k8s/dns-policy',
          'l1-k8s/quest-pod-unreachable',
        ],
      },
      {
        title: '机房里的高性能网络',
        hint: '无损以太网那套参数与 IB 的差别，得能自己调、自己测',
        lessons: [
          'l2-hpc/why-rdma',
          'l2-hpc/roce',
          'l2-hpc/infiniband',
          'l2-hpc/topology-rail',
          'l2-hpc/perftest',
        ],
      },
      {
        title: '规划与值班',
        hint: '算得出端口与地址，也把排障沉淀成指标和 SOP',
        lessons: [
          'l3-planning/ethernet-plan',
          'l3-planning/ip-plan',
          'l4-advanced/observability',
          'l4-advanced/oncall',
        ],
      },
    ],
  },
]

/* ---------- 派生查询 ---------- */

export function getTrack(trackId: string): Track | undefined {
  return tracks.find((t) => t.id === trackId)
}

/** 按分组展开一个阶段的课程；这也是全站的学习顺序 */
export function groupedLessons(track: Track) {
  return track.groups.map((group) => {
    const lessons = group.lessons
      .map((id) => track.lessons.find((l) => l.id === id))
      .filter((l): l is Lesson => Boolean(l))
    return {
      group,
      lessons,
      minutes: lessons.reduce((sum, l) => sum + l.minutes, 0),
      readyCount: lessons.filter((l) => l.status === 'ready').length,
    }
  })
}

/** 一个阶段里按学习顺序排好的全部课程 */
export function orderedLessons(track: Track): Lesson[] {
  return track.groups.flatMap((group) =>
    group.lessons
      .map((id) => track.lessons.find((l) => l.id === id))
      .filter((l): l is Lesson => Boolean(l)),
  )
}

export function getLessonGroup(track: Track, lessonId: string): LessonGroup | undefined {
  return track.groups.find((g) => g.lessons.includes(lessonId))
}

/** 全站课程，已按阶段与分组排好顺序 */
export const allLessons = tracks.flatMap((track) =>
  orderedLessons(track).map((lesson) => ({ track, lesson })),
)

export function getLesson(trackId: string, lessonId: string) {
  const track = getTrack(trackId)
  if (!track) return undefined
  const ordered = orderedLessons(track)
  const index = ordered.findIndex((l) => l.id === lessonId)
  if (index === -1) return undefined
  return {
    track,
    lesson: ordered[index],
    group: getLessonGroup(track, lessonId),
    prev: ordered[index - 1],
    next: ordered[index + 1],
  }
}

export interface RolePathItem {
  track: Track
  lesson: Lesson
  key: string
  /** 在整条路线里的序号，从 1 开始，跨段连续 */
  index: number
}

/**
 * 解析一条岗位路线：把课程 key 换成课程对象，编上跨段连续的序号，并汇总时长。
 * 写错 key 的条目直接丢掉，不让首页因为一个笔误崩掉。
 */
export function getRolePath(roleId: string) {
  const role = ROLE_PATHS.find((r) => r.id === roleId)
  if (!role) return undefined

  let index = 0
  const stages = role.stages.map((stage) => {
    const items = stage.lessons
      .map((key) => {
        const [t, l] = key.split('/')
        const found = getLesson(t, l)
        if (!found) return undefined
        index += 1
        return { track: found.track, lesson: found.lesson, key, index }
      })
      .filter((x): x is RolePathItem => Boolean(x))
    return {
      stage,
      items,
      minutes: items.reduce((sum, i) => sum + i.lesson.minutes, 0),
    }
  })

  const items = stages.flatMap((s) => s.items)
  return {
    role,
    stages,
    items,
    lessonCount: items.length,
    minutes: items.reduce((sum, i) => sum + i.lesson.minutes, 0),
  }
}

/** 解析出「建议先学」的课程列表 */
export function getPrereqs(trackId: string, lessonId: string) {
  return (PREREQ[lessonKey(trackId, lessonId)] ?? [])
    .map((key) => {
      const [t, l] = key.split('/')
      const found = getLesson(t, l)
      return found ? { track: found.track, lesson: found.lesson, key } : undefined
    })
    .filter((x): x is { track: Track; lesson: Lesson; key: string } => Boolean(x))
}

/** 全局线性顺序，用于"上一课 / 下一课"跨阶段跳转 */
export function getFlatNeighbors(trackId: string, lessonId: string) {
  const index = allLessons.findIndex(
    (item) => item.track.id === trackId && item.lesson.id === lessonId,
  )
  return {
    prev: index > 0 ? allLessons[index - 1] : undefined,
    next: index >= 0 && index < allLessons.length - 1 ? allLessons[index + 1] : undefined,
  }
}

export function lessonKey(trackId: string, lessonId: string) {
  return `${trackId}/${lessonId}`
}

/**
 * 在一条岗位路线里找相邻课程 —— 沿路线阅读时，「下一课」要跳路线的下一节，
 * 而不是目录里的下一节（那两者经常不是同一节，路线本来就是跨阶段跳的）。
 *
 * 返回 undefined 有两种情况：roleId 不认识，或这一节没排进这条路线。
 */
export function getRoleNeighbors(roleId: string, trackId: string, lessonId: string) {
  const path = getRolePath(roleId)
  if (!path) return undefined

  const key = lessonKey(trackId, lessonId)
  const at = path.items.findIndex((item) => item.key === key)
  if (at === -1) return undefined

  return {
    path,
    current: path.items[at],
    /** 这一节属于路线里的哪一段 */
    stage: path.stages.find((s) => s.items.some((i) => i.key === key))?.stage,
    prev: path.items[at - 1],
    next: path.items[at + 1],
  }
}

export const stats = {
  trackCount: tracks.length,
  lessonCount: allLessons.length,
  readyCount: allLessons.filter(({ lesson }) => lesson.status === 'ready').length,
  labCount: allLessons.filter(({ lesson }) => lesson.kind === 'lab' || lesson.kind === 'quest')
    .length,
  plannerCount: allLessons.filter(({ lesson }) => lesson.kind === 'planner').length,
  totalMinutes: allLessons.reduce((sum, { lesson }) => sum + lesson.minutes, 0),
}
