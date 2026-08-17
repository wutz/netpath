# Netpath

**系统与集群网络**的在线交互式学习项目。

从 Linux 协议栈上一个包走过的每一跳出发，拆开 K8s 容器网络的机制，进入 InfiniBand 与 RoCE
的高性能战场，最后学会把业务需求翻译成端口数、交换机台数和线缆数。

## 学习路径

| 阶段 | 主题 | 说明 |
| --- | --- | --- |
| **L0** | 网络基础 | 报文收发路径、带宽/PPS/延迟三指标、二三层转发、TCP 行为、内核栈调优、观测工具箱 |
| **L1** | 容器网络 | netns/veth、K8s 网络模型、CNI 数据平面、Service、kube-proxy 与 eBPF、Ingress、DNS/策略、次级 CNI |
| **L2** | 高性能网络 | PCIe 拓扑与带宽账、NVLink/NVSwitch、RDMA 原理、InfiniBand、RoCEv2 与无损以太网、Fat-Tree/Rail 拓扑、perftest、K8s RDMA、NCCL |
| **L3** | 网络规划 | 需求拆解、以太网 Spine-Leaf 端口账、地址与 VLAN 规划、计算网 Rail 布线账、IB/RoCE 选型 |
| **L4** | 进阶专题 | SR-IOV/MacVLAN、eBPF/XDP、DPDK、BGP 与 gARP、GPUDirect RDMA、NVMe-oF、MPI、DPU、可观测性、值班手册 |
| **L5** | 代理与隧道 | HTTP/SOCKS5 代理、SSH 端口转发、gost、WireGuard、Tailscale、Pritunl、受限网络诊断、流量特征、Mihomo 分流规则、透明网关 |

共 6 个阶段 **53 节课**（约 28 小时），其中 **23 节已有正文**，其余为定稿大纲（课程页会渲染大纲占位）。
动手环节 15 个：9 个实验 + 4 个命令行闯关 + 2 个规划计算器。

> L5 可以脱离前面的顺序独立学 —— 它是日常工具箱（把内网服务安全暴露给自己、把流量按规则送出去、
> 把散落各处的机器组成一张网），不依赖 L1/L2 的知识。

线上地址：<https://netpath.wutz.dev>

## 交互形式

- **检查点（Quiz）** —— 随堂单选/多选，选错给针对性反馈，答对写入本地进度
- **路径推演（PacketPathExplorer）** —— 10 个场景（主机收发、同节点/跨节点 Pod、ClusterIP、
  LoadBalancer、RoCE WRITE、GPUDirect RDMA、SSH 动态转发、WireGuard 隧道），
  逐跳展开，每跳都给出**观测命令**与**典型故障方式**
- **配图（Figure）** —— 引用外部示意图时统一走这个组件，图注与来源链接位置固定，不给漏署名留余地
- **命令行闯关（Terminal）** —— 模拟终端，预置真实的 `ethtool -S`、`softnet_stat`、NCCL 日志输出，
  按目标一步步定位根因；支持 `goals` / `hint` / `help` / 命令历史
- **规划计算器（Planner）** —— 两个：
  - 以太网 Spine-Leaf 端口账（leaf/spine 台数、收敛比、线缆数、余量）
  - 计算网 Rail-Optimized 布线账（rail、leaf/spine、线缆、对分带宽），
    输入 31 节点 / 8 卡 / 64 口交换机时结果与 **DGX SuperPOD H200 参考架构 Table 4 完全一致**
- **进度追踪** —— 存 localStorage，无账号体系，换设备不同步

## 技术栈

与 [storpath](https://storpath.wutz.dev/) / [storplan](https://storplan.wutz.dev/) 保持一致：

- **TanStack Start / Router** —— 全栈 React 框架 + 类型安全文件路由
- **MDX** —— 课程正文，可直接内嵌交互组件
- **Shiki** —— 构建期代码高亮
- **Tailwind CSS 4** —— 样式
- **Cloudflare Workers** —— 部署

## 快速开始

```bash
bun install
bun run dev        # http://localhost:3002
bun run build
bun run typecheck
bun run deploy     # 手工部署到 Cloudflare Workers
```

## 持续部署

用 **Cloudflare Workers Builds**，无需在 GitHub 里存密钥。
Dashboard → Compute (Workers) → `netpath` → Settings → Build → Connect，
授权 GitHub App 并选中 `wutz/netpath`，构建命令填 `bun run build`，部署命令填 `bunx wrangler deploy`。
之后推送到 `main` 即自动部署。

> Workers Builds 的仓库连接依赖 GitHub App 的 OAuth 授权，只能在 Dashboard 上完成，wrangler CLI 没有对应命令。

## 项目结构

```
netpath/
├── src/
│   ├── lib/
│   │   ├── curriculum.ts       # 课程大纲：全站唯一数据源
│   │   ├── content.ts          # MDX 正文加载
│   │   ├── progress.ts         # 学习进度（localStorage）
│   │   ├── netunits.ts         # Gbps/GB/s/PPS/BDP 换算，口径全站统一
│   │   ├── packet-path.ts      # 10 个报文路径场景的逐跳数据
│   │   ├── eth-plan.ts         # 以太网 Spine-Leaf 三笔账
│   │   └── fabric-plan.ts      # Rail-Optimized 计算网布线账（含 SuperPOD 对照表）
│   ├── components/
│   │   ├── Callout.tsx             # note / tip / warn / trap 四种提示框
│   │   ├── Quiz.tsx                # 随堂检查点
│   │   ├── Terminal.tsx            # 命令行闯关模拟器
│   │   ├── Figure.tsx              # 带出处署名的配图
│   │   ├── PacketPathExplorer.tsx  # 报文路径逐跳推演
│   │   ├── EthernetPlanner.tsx     # 以太网端口账计算器
│   │   ├── FabricPlanner.tsx       # 计算网布线账计算器
│   │   ├── mdx-components.tsx      # MDX 全局组件表
│   │   └── lesson-context.ts       # 当前课程 key，供交互组件写进度
│   ├── content/                # 课程正文
│   │   ├── l0-basics/          # 7 节（5 节有正文）
│   │   ├── l1-k8s/             # 9 节（3 节有正文）
│   │   ├── l2-hpc/             # 10 节（5 节有正文）
│   │   ├── l3-planning/        # 5 节（2 节有正文）
│   │   ├── l4-advanced/        # 10 节（1 节有正文）
│   │   └── l5-tunnel/          # 12 节（7 节有正文）
│   ├── routes/
│   │   ├── __root.tsx
│   │   ├── index.tsx                    # 首页：路径总览 + 进度
│   │   ├── tracks.$trackId.tsx          # 阶段详情
│   │   ├── learn.$trackId.$lessonId.tsx # 课程页
│   │   └── labs.tsx                     # 实验与闯关索引
│   ├── router.tsx
│   └── styles.css
├── vite.config.ts
└── wrangler.toml
```

## 新增一节课

1. 在 `src/lib/curriculum.ts` 对应阶段里加一条 `Lesson`，写清 `objectives` 和 `outline`
2. 状态先留 `'planned'` —— 课程页会自动渲染大纲占位，路径图上标记为「大纲」
3. 正文写好后建 `src/content/<trackId>/<lessonId>.mdx`，把状态改成 `'ready'`

> 两个 MDX 陷阱：
> - JSX 属性值用双引号包裹，**属性内部不要再出现半角双引号**（用 `「」` 代替）
> - 正文里不要出现 `<80%` 这种「小于号紧跟字符」的写法，MDX 会当成 JSX 标签解析。写成「低于 80%」

MDX 里可以直接使用交互组件，无需 import：

```mdx
<Callout type="trap" title="新人常踩的坑">
MTU 必须端到端一致，任何一跳不一致都会导致大包被丢弃。
</Callout>

<Quiz
  id="net-1"
  question="一台 leaf 有 48 个 25G 下行口和 4 个 100G 上行口，收敛比是多少？"
  options={[
    { text: '3:1', correct: true },
    { text: '12:1', feedback: '收敛比按带宽算，不按端口数算。' },
  ]}
  explain={<>下行 1200 Gbps，上行 400 Gbps，即 3:1。</>}
/>

<PacketPathExplorer only={["host-tx", "host-rx"]} />
<EthernetPlanner />
<FabricPlanner />

<Figure
  src="https://example.com/diagram.png"
  alt="示意图"
  caption="一句话说明这张图在讲什么。"
  source="作者 · 站点名"
  href="https://example.com/original-article"
/>
```

> 引用外部图片一律用 `Figure` 并填 `source` 与 `href`，把出处指向原文而不是图片本身。

命令行闯关：给命令加 `goal` 字段即成为闯关目标，全部达成后自动记录通过。
`aliases` 可以接受等价写法，减少"命令没预置"的挫败感。

```mdx
<Terminal
  id="slow-host-quest"
  host="root@k8s-work-103"
  commands={[
    { cmd: 'ethtool bond0', goal: '确认链路速率协商正常', hint: '第一层永远是接口与链路', output: `...` },
    { cmd: 'ethtool -S bond0', aliases: ['ethtool -S bond0 | grep -i drop'], output: `...` },
  ]}
/>
```

## 内容来源

- **K8s 容器网络** —— [The Kubernetes Networking Guide](https://www.tkng.io/) 与
  [k8s-in-action](https://github.com/wutz) 的 `network/` 手册（cilium、metallb、kube-ovn、
  network-operator、spiderpool、ingress-nginx、istio、cert-manager）
- **高性能网络** —— [DGX SuperPOD H200 参考架构](https://docs.nvidia.com/dgx-superpod/reference-architecture/scalable-infrastructure-h200/latest/abstract.html)
  [NVLink 与 NVLink Switch 规格](https://www.nvidia.com/en-us/data-center/nvlink/)、[PCI-SIG](https://pcisig.com/specifications)
  与 k8s-in-action 的 `ai/nccl-tests/`（NCCL 参数表与 busbw 判定标准）
- **系统基础** —— Brendan Gregg《Systems Performance, 2nd Edition》
- **代理与隧道** ——
  [A Practical Guide to SSH Tunnels](https://labs.iximiuz.com/tutorials/ssh-tunnels)（Ivan Velichko / iximiuz Labs，
  本站 SSH 那一节的示意图引自此文并已署名）、
  [GOST](https://gost.run/)、
  [WireGuard](https://www.wireguard.com/)、
  [How Tailscale Works](https://tailscale.com/blog/how-tailscale-works)、
  [Pritunl](https://pritunl.com/)、
  [Clash Verge Rev](https://github.com/clash-verge-rev/clash-verge-rev)、
  [anytls-go](https://github.com/anytls/anytls-go)、
  [科学上网 — haoel](https://github.com/haoel/haoel.github.io)
- **存储侧的对照** —— [Storpath](https://storpath.wutz.dev/)

## 后续可做

- 补齐剩余 30 节正文（优先 L2 的 InfiniBand 与 Rail 拓扑两节、L1 的 netns/veth 实验、L5 的 SSH 进阶与透明网关）
- 再加三个闯关：Pod 之间不通、MTU 黑洞、隧道断点定位
- 拓扑图交互组件：拖动节点数看 leaf/spine 布线图变化
- 深色模式（Shiki 已按双主题编译，接一个切换即可）
- 全站搜索
