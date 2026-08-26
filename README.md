# Netpath

**网络成长路径** —— 网络方向的在线交互式学习项目。

从「怎么才能看到一手资料」开始，走过 Linux 协议栈上一个包的每一跳，进入 InfiniBand 与 RoCE
的高性能战场，拆开 K8s 容器网络的机制，最后学会把业务需求翻译成端口数、交换机台数和线缆数。

## 五个分类

| 分类 | 主题 | 说明 |
| --- | --- | --- |
| **GFW** | 科学上网 | 症状分类与诊断、HTTP/SOCKS5 代理、VPS 线路与 anytls 服务端、Mihomo 分流规则与旁路由、隧道排障闯关 |
| **SSH** | 访问集群 | SSH 端口转发与配置固化（`-L`/`-R`/`-D`、ProxyJump、ControlMaster）、WireGuard / Tailscale / Pritunl 三选一 |
| **ETH** | 以太网与协议栈 | 一次 curl 的全过程、带宽/PPS/延迟三指标、二三层转发、报文收发路径、TCP 行为、内核栈调优、观测工具箱、Spine-Leaf 端口账、可观测性与值班手册 |
| **HPC** | 高性能网络 | PCIe 拓扑与带宽账、NVLink/NVSwitch、RDMA 原理、InfiniBand、RoCEv2 与无损以太网、**策略路由**、perftest、Rail 拓扑、NCCL/MPI、GPUDirect、NVMe-oF、DPU、DPDK、计算网规划与选型 |
| **K8S** | K8s 网络 | K8s 网络模型、netns/veth、CNI 数据平面、eBPF/XDP、Service、kube-proxy、MetalLB、Ingress、DNS/策略、地址规划、SR-IOV/次级 CNI、K8s RDMA |

共 5 个分类、**21 个小组**、**50 节课**（约 27 小时），**50 节全部有正文**。
动手环节 14 个：8 个实验 + 4 个命令行闯关 + 2 个规划计算器。

**这张表是主题归类，不是学习顺序** —— 顺序由下面那条完整路径定义。
每个分类内部再拆成 2～6 个小组，是 `/tracks` 各分类页的组织方式。
另有一张集中维护的前置依赖图（`PREREQ`），课程页会提示「建议先学」哪几节 ——
所以从任意一节切入都不会卡住。

## 一条完整学习路径

**首页就一处入口**（`FULL_PATH`），50 节课全部排在上面，切成 **17 段**。
版式与 [storpath](https://storpath.wutz.dev/) 对齐：框架段 → 入口卡（`已完成 N/50` + 进度条 +
「开始学 · 第 1 节 …」）→ 一段一张卡的阶梯 → 结尾一句话。

每段一张卡：卡头是**分类徽标 + 「第 N 步」 + 段标题 + 节数时长 + 本段进度**，
下面一句话说明这段解决什么；段内每行课是**段内序号 + 标题 + 一句话说明**，
右侧最多一个标签（`实验` / `闯关` / `规划`，纯读的课若标了 `深入` 则占这个位置）加时长。
序号每段从 1 重新数。

**首页只有这一条线** —— 底下原来还有一个折叠的「全部课程」目录，
但路径本身已经收了全部 50 节，同一批课在一页上列两遍只会让人怀疑两份清单不一样，
所以合并掉了。按主题读的入口没有丢：**每段卡头的标题就链到它所属的分类页**，
五个分类都能从这条线上直接进去。

| 段 | 标题 | 课程 |
| --- | --- | --- |
| 1 | 先解决「看得到资料」这件事 | 症状分类与诊断、代理基础 |
| 2 | 自己搭一条稳定的线 | VPS + anytls、Mihomo 分流、隧道闯关 |
| 3 | 连上远端机器 | SSH 端口转发、VPN 组网三选一 |
| 4 | 把网络当成一件事看 | 一次 curl、三个指标、二三层 |
| 5 | 跟着一个包走完全程 | 报文路径、TCP 行为 |
| 6 | 第一次自己查 | 观测工具箱、"网络慢"闯关 |
| 7 | 主机侧的旋钮与端口账 | 内核栈调优、以太网规划 |
| 8 | 为什么要绕开内核 | RDMA 原理、PCIe、NVLink |
| 9 | IB 与无损以太网 | InfiniBand、RoCEv2、**策略路由** |
| 10 | 打通并验收一条链路 | perftest、Rail 拓扑 |
| 11 | 上层网络库 | NCCL、MPI、AllReduce 闯关 |
| 12 | GPU、存储与卸载 | GPUDirect、NVMe-oF、DPU、DPDK |
| 13 | 把需求写成一张采购单 | 需求拆解、计算网规划、IB/RoCE 选型 |
| 14 | 容器网络：先手搓，再看 K8s | 四条铁律、netns/veth、CNI、eBPF/XDP |
| 15 | 服务是怎么被访问到的 | Service、kube-proxy、MetalLB、Ingress、DNS/策略 |
| 16 | 划地盘，把网卡插进去 | 地址规划、SR-IOV、次级 CNI、K8s RDMA |
| 17 | 闯关与长期值班 | Pod 不通闯关、可观测性、值班手册 |

**路径顺序不等于目录顺序**：目录按主题分类，路径按「学得动」排。五条排序规则：

1. **能查到资料排第一。** 网络方向的一手资料几乎都在海外，这件事不解决，后面每一节能读到的东西都打折。
2. **门槛低、当天用得上的先来。** 远程接入排在协议原理之前：集群在跳板机后面，连不上什么都做不了。
3. **概念在前，工具在后，闯关收尾。** 先知道包往哪走，再学看它的命令，最后接一台真出问题的机器。
4. **跨分类的课按主题就近合并。** SR-IOV / MacVLAN 和次级 CNI 讲的是同一件事，排在一起；
   可观测性与值班手册归在 ETH，但排到整条路径的最后。
5. **算账放最后。** 规划要用到前面全部的数字。

`PREREQ` 里的每一条前置依赖都落在路径的更早位置，按顺序走不会遇到「建议先学」指向后面的课
（这一点有脚本校验）。课程另按 `DEPTH` 标了「入门 / 深入」两端，标「深入」的赶时间可以先跳过。

> 段的徽标取该段里出现最多的那个分类。个别段是跨分类的（比如最后一段把 K8s 的闯关
> 和 ETH 的值班手册排在一起），这时**行内会额外标出这一行属于哪个分类**。

**课程页的导航跟着路径走**：「下一课 / 上一课」取的是路径的相邻节而不是目录的相邻节，
右栏目录是整条路径（能看到自己在 50 节里的第几步），顶部提示条显示「第 N / 50 节 + 当前段落」。
路径里找不到某节（key 写错）时才退回目录顺序。

> **进度存在浏览器 localStorage。** 课程按五个分类重切时 trackId 变了，
> `progress.ts` 里有一张 v1 → v2 的一次性迁移表，老的完成记录会被搬过来，
> 合并掉的课映射到承接它的那一节。

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
│   │   ├── gfw/                # 5 节 · 科学上网
│   │   ├── access/             # 2 节 · 访问集群
│   │   ├── ethernet/           # 11 节 · 以太网与协议栈
│   │   ├── hpc/                # 18 节 · 高性能网络
│   │   └── k8s/                # 14 节 · K8s 网络
│   ├── routes/
│   │   ├── __root.tsx
│   │   ├── index.tsx                    # 首页：完整学习路径（17 段）+ 结尾的分类入口
│   │   ├── tracks.$trackId.tsx          # 分类详情
│   │   ├── learn.$trackId.$lessonId.tsx # 课程页
│   │   └── labs.tsx                     # 实验与闯关索引
│   ├── router.tsx
│   └── styles.css
├── vite.config.ts
└── wrangler.toml
```

## 新增一节课

1. 在 `src/lib/curriculum.ts` 对应分类里加一条 `Lesson`，写清 `objectives` 和 `outline`
2. **把它的 id 加进某个 `groups[].lessons`** —— 分类页的展示顺序由这里决定
   （零经验也能读的加进 `DEPTH` 标 `intro`，需要背景才看得懂的标 `deep`）
3. 有强依赖时在 `PREREQ` 里登记，课程页会显示「建议先学」
4. 新增课程可先留 `'planned'` —— 课程页会自动渲染大纲占位，路径图上标记为「大纲」
5. 正文写好后建 `src/content/<trackId>/<lessonId>.mdx`，把状态改成 `'ready'`
6. 把 `<trackId>/<lessonId>` 加进 `FULL_PATH` 里合适的一段
   （路径是全集，漏加的课在首页那条线上不会出现）

> 调整学习顺序改 `FULL_PATH`，调整分类页的展示顺序改 `groups[].lessons`，
> 两者都不用挪动 `Lesson` 对象。

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

- 再加三个闯关：Pod 之间不通、MTU 黑洞、隧道断点定位
- 拓扑图交互组件：拖动节点数看 leaf/spine 布线图变化
- 深色模式（Shiki 已按双主题编译，接一个切换即可）
- 全站搜索
