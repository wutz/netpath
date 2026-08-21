/**
 * 报文路径推演的数据源。
 *
 * 每个场景是一串「跳」，每一跳都尽量给出两样东西：
 *   observe —— 这一跳能用什么命令看
 *   risk    —— 这一跳典型的丢包 / 失败方式
 *
 * 延迟量级只标数量级，用于场景之间对比，不作为承诺值。
 */

export type Layer = 'app' | 'kernel' | 'driver' | 'wire' | 'switch' | 'peer' | 'gpu'

export const LAYER_META: Record<Layer, { label: string; dot: string; chip: string }> = {
  app: { label: '应用', dot: 'bg-brand-500', chip: 'bg-soft-2 text-body' },
  kernel: { label: '内核', dot: 'bg-info', chip: 'bg-soft-2 text-body' },
  driver: { label: '驱动/网卡', dot: 'bg-plum', chip: 'bg-soft-2 text-body' },
  wire: { label: '线路', dot: 'bg-line-strong', chip: 'bg-soft-2 text-body' },
  switch: { label: '交换机', dot: 'bg-warn', chip: 'bg-soft-2 text-body' },
  peer: { label: '对端', dot: 'bg-ink', chip: 'bg-soft-2 text-body' },
  gpu: { label: 'GPU', dot: 'bg-danger', chip: 'bg-soft-2 text-body' },
}

export interface Hop {
  id: string
  title: string
  detail: string
  layer: Layer
  observe?: string
  risk?: string
}

export interface Scenario {
  id: string
  label: string
  summary: string
  /** 延迟量级，用于场景对比 */
  latency: string
  /** 这条路径最值得记住的一句话 */
  takeaway: string
  hops: Hop[]
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'host-tx',
    label: '主机发包',
    summary: '一次 send() 之后，数据要经过四个队列才上得了网线。',
    latency: '微秒级（本机部分）',
    takeaway: '发送方向的丢包几乎都在队列上：sndbuf 满、qdisc 满、ring 满，三处各有各的计数器。',
    hops: [
      {
        id: 'send',
        title: 'send() / write() 系统调用',
        detail: '应用把用户态缓冲区里的字节交给内核，发生一次用户态到内核态的切换和一次内存拷贝。阻塞式 socket 在 sndbuf 满时会在这里睡住。',
        layer: 'app',
        observe: 'strace -c -p <pid>',
        risk: '应用侧表现为 send() 变慢或返回 EAGAIN —— 这不是网络慢，是发送缓冲已经排满。',
      },
      {
        id: 'sndbuf',
        title: 'socket 发送缓冲区',
        detail: '数据进入这条连接的 sndbuf 排队等待发送。窗口和拥塞控制决定一次能放出去多少，剩下的留在这里。',
        layer: 'kernel',
        observe: 'ss -tim dst <ip>   # 看 Send-Q、cwnd、wscale',
        risk: 'Send-Q 长期不降，说明对端收得慢或路径在丢包，问题不在本机。',
      },
      {
        id: 'tcpip',
        title: 'TCP/IP 协议栈封装',
        detail: '分段（受 MSS 限制）、加 TCP 头、加 IP 头、查路由表选出口网卡和下一跳、必要时查 ARP 拿目的 MAC。开了 TSO 时分段推迟到网卡里做。',
        layer: 'kernel',
        observe: 'ip route get <ip>;  nstat -az | grep -i retrans',
        risk: '路由缺失、ARP 解析失败、MTU 与 MSS 不匹配，都在这一步暴露。',
      },
      {
        id: 'qdisc',
        title: 'qdisc 排队规则',
        detail: '出口流控层。默认 fq_codel 之类的算法在这里决定谁先走、超额的包丢掉。做限速、优先级、RoCE 的 DSCP 标记也在这一层。',
        layer: 'kernel',
        observe: 'tc -s qdisc show dev bond0',
        risk: 'dropped 计数增长 = 发送侧被主动丢包，通常是限速配置或队列太浅。',
      },
      {
        id: 'ring-tx',
        title: '驱动发送环形队列（tx ring）',
        detail: '内核把描述符放进 ring，网卡通过 DMA 自己去取数据。ring 满时内核停止投递并触发发送队列休眠。',
        layer: 'driver',
        observe: 'ethtool -S bond0 | grep -i "tx.*\\(drop\\|err\\)";  ethtool -g bond0',
        risk: 'tx_dropped / tx_errors 增长；也可能表现为 dmesg 里的 tx timeout（网卡卡死后复位）。',
      },
      {
        id: 'nic-tx',
        title: '网卡串行化上线',
        detail: '网卡做校验和、TSO 分段，把比特按线速推上光纤。25Gbps 下发一个 1500 字节的帧约 0.5 微秒，这就是串行化延迟。',
        layer: 'wire',
        observe: 'ethtool bond0 | grep Speed',
        risk: '协商到了错误速率（比如 100G 口跑成 25G），带宽上限直接掉一个档。',
      },
    ],
  },
  {
    id: 'host-rx',
    label: '主机收包',
    summary: '收包比发包更容易丢，因为中断、软中断、协议栈、应用四段速度必须匹配。',
    latency: '微秒级（本机部分）',
    takeaway: '收方向要盯三个计数器：网卡 rx_missed（来不及 DMA）、softnet backlog（软中断跟不上）、Recv-Q（应用读得慢）。',
    hops: [
      {
        id: 'dma-rx',
        title: '网卡 DMA 写入 rx ring',
        detail: '网卡收到帧后校验、按 RSS 哈希选一个接收队列，直接 DMA 写进预先挂好的内存。ring 里没有空描述符时，帧被直接丢弃。',
        layer: 'driver',
        observe: 'ethtool -S bond0 | grep -iE "rx_missed|rx_no_buf|discard"',
        risk: 'rx_missed_errors / rx_no_buffer_count 增长：CPU 回收描述符的速度跟不上收包速度，加大 ring 或散到更多队列。',
      },
      {
        id: 'hardirq',
        title: '硬中断',
        detail: '网卡发中断通知 CPU。中断合并（interrupt coalescing）会攒一批再通知，用一点延迟换大幅降低的 CPU 开销。',
        layer: 'driver',
        observe: 'cat /proc/interrupts | grep mlx;  ethtool -c bond0',
        risk: '中断全落在一个 CPU 上（亲和性没配）→ 单核 100% si，其它核闲着。',
      },
      {
        id: 'napi',
        title: 'NAPI 软中断轮询',
        detail: '硬中断只做登记，真正取包在 NET_RX 软中断里批量轮询完成。一次轮询有预算上限（netdev_budget），超了就让出 CPU 下次再来。',
        layer: 'kernel',
        observe: 'cat /proc/net/softnet_stat;  mpstat -P ALL 1   # 看 %soft',
        risk: 'softnet_stat 第二列（dropped）增长 = backlog 满；第三列（time_squeeze）增长 = 预算用尽，说明单核处理不过来。',
      },
      {
        id: 'stack-rx',
        title: '协议栈处理',
        detail: 'GRO 先把连续小包合成大包，然后走 netfilter/conntrack、路由判断、TCP 状态机，最后按四元组找到目标 socket。',
        layer: 'kernel',
        observe: 'nstat -az | grep -iE "TcpExt|drop";  conntrack -S',
        risk: 'conntrack 表满、反向路径过滤（rp_filter）丢包、TCP 校验错误，都在这层被静默丢弃。',
      },
      {
        id: 'recvbuf',
        title: 'socket 接收缓冲区',
        detail: '数据进 rcvbuf 排队，同时决定通告给对端的接收窗口。应用不来读，窗口就会缩小，最后通告零窗口让对端停下。',
        layer: 'kernel',
        observe: 'ss -tim | grep -A1 <port>   # 看 Recv-Q',
        risk: 'Recv-Q 持续很高 = 应用消费太慢。这时候优化网络毫无用处，要去优化应用。',
      },
      {
        id: 'read',
        title: 'read() / recv() 返回应用',
        detail: '再一次内核态到用户态的拷贝。到这里，这个包的旅程结束。',
        layer: 'app',
        observe: 'strace -T -p <pid>',
      },
    ],
  },
  {
    id: 'pod-same-node',
    label: '同节点 Pod → Pod',
    summary: '两个 Pod 在同一台机器上，包根本不出网卡。',
    latency: '几十微秒',
    takeaway: '同节点通信不出网卡，所以「网络慢」的报障如果发生在同节点两个 Pod 之间，先怀疑 CPU 和策略，别怀疑网线。',
    hops: [
      {
        id: 'pod-a',
        title: 'Pod A 的 eth0（容器内视角）',
        detail: 'Pod A 里的 eth0 是一根 veth 的一头，另一头在宿主机的 root netns 里。容器看到的就是一张普通网卡。',
        layer: 'app',
        observe: 'kubectl exec pod-a -- ip -d addr show eth0',
      },
      {
        id: 'veth-a',
        title: 'veth pair 穿越命名空间',
        detail: '包从 Pod netns 的一端进去，立刻从宿主机侧的另一端出来。这一步是纯内存操作，没有任何物理传输。',
        layer: 'kernel',
        observe: 'ip -d link show | grep -A2 veth;  ip netns list',
        risk: 'veth 上的 MTU 与物理网卡不一致时，大包在这里就出问题。',
      },
      {
        id: 'datapath',
        title: '宿主机数据平面转发',
        detail: 'eBPF 数据平面在这里直接把包送进目标 Pod 的 veth；传统方案则要过网桥或 iptables 规则。NetworkPolicy 也在这一层判决。',
        layer: 'kernel',
        observe: 'cilium-dbg endpoint list;  cilium-dbg monitor --type drop',
        risk: '被 NetworkPolicy 拒绝时包在这里被丢，Pod 内什么都看不到 —— 一定要在宿主机侧看 drop 事件。',
      },
      {
        id: 'veth-b',
        title: '进入 Pod B 的 netns',
        detail: '从目标 Pod 对应的 veth 递交进去，Pod B 的协议栈按正常收包流程处理。',
        layer: 'peer',
        observe: 'kubectl exec pod-b -- ss -lnt',
        risk: '目标端口没监听，或容器内程序绑了 127.0.0.1 而不是 0.0.0.0。',
      },
    ],
  },
  {
    id: 'pod-cross-node',
    label: '跨节点 Pod → Pod',
    summary: '这才是 CNI 真正干活的地方：包要带着 Pod IP 跨过物理网络。',
    latency: '百微秒级',
    takeaway: 'overlay 多两层封装、吃掉 50 字节 MTU；原生路由没有封装开销，但要求物理网络认识 Pod CIDR。',
    hops: [
      {
        id: 'pod-a',
        title: 'Pod A 发出，源地址是 Pod IP',
        detail: '按 K8s 网络模型的要求，跨节点通信不做 NAT，对端看到的源地址就是 Pod A 的 IP。',
        layer: 'app',
        observe: 'kubectl exec pod-a -- ip route',
      },
      {
        id: 'encap',
        title: '封装或直接路由（分岔点）',
        detail: 'overlay 模式下宿主机把原包塞进 VXLAN/Geneve，外层是节点 IP；原生路由模式下不封装，靠宿主机路由表和物理网络的 BGP 宣告直接转发。',
        layer: 'kernel',
        observe: 'ip route show table all | grep <pod-cidr>;  bridge fdb show dev vxlan.calico',
        risk: 'overlay 忘了给 Pod 网卡留封装余量（1500 − 50 = 1450）→ 小包正常、大包卡死，最典型的 MTU 黑洞。',
      },
      {
        id: 'phys-nic',
        title: '宿主机物理网卡发出',
        detail: '此后就是一次普通的主机发包：qdisc、tx ring、上线。封装包的源目 IP 是两台节点的地址。',
        layer: 'driver',
        observe: 'tcpdump -i bond0 -nn "udp port 8472 or udp port 6081"',
      },
      {
        id: 'fabric',
        title: '经 leaf → spine → leaf',
        detail: '同 leaf 下两台机器一跳可达；跨 leaf 要上 spine 再下来，共三跳。收敛比不足时这段就是瓶颈。',
        layer: 'switch',
        risk: '交换机端口错误、上行拥塞导致的排队延迟，主机侧只能看到 RTT 变大。',
      },
      {
        id: 'decap',
        title: '对端节点解封装并投递',
        detail: '目标节点剥掉外层头，按 Pod IP 查到本机的目标 veth，递交进 Pod B。',
        layer: 'peer',
        observe: 'cilium-dbg monitor --related-to <endpoint-id>',
      },
    ],
  },
  {
    id: 'service-clusterip',
    label: '访问 ClusterIP',
    summary: 'ClusterIP ping 不通却能连上 —— 因为它不是一个真的地址。',
    latency: '百微秒级',
    takeaway: 'DNAT 发生在客户端所在节点，出了那台机器包上就没有 ClusterIP 了。所以在服务端抓包永远抓不到 VIP。',
    hops: [
      {
        id: 'dns',
        title: 'DNS 解析服务名',
        detail: '客户端 Pod 向 CoreDNS 查 svc.ns.svc.cluster.local，拿回 ClusterIP。集群里相当多的「网络故障」其实止步于这一跳。',
        layer: 'app',
        observe: 'kubectl exec pod-a -- cat /etc/resolv.conf;  nslookup svc.ns',
        risk: 'ndots:5 让每个短名字先试几个 search 域，DNS 压力被放大数倍。',
      },
      {
        id: 'connect',
        title: '向 ClusterIP 发起连接',
        detail: '客户端以为自己在连一个具体地址，其实这个地址不属于任何网卡，也没有任何设备会回应 ICMP —— 这就是 ping 不通的原因。',
        layer: 'app',
        observe: 'kubectl get svc svc -o wide;  kubectl get endpointslices',
      },
      {
        id: 'dnat',
        title: '本节点完成 DNAT',
        detail: '在客户端所在节点上，目的地址被改写成某个后端 Pod IP。iptables 模式靠规则链匹配，IPVS 靠哈希表，eBPF 模式在 socket 层就改掉了地址，包根本没经过转发路径。',
        layer: 'kernel',
        observe: 'iptables-save | grep <svc-name>;  ipvsadm -Ln;  cilium-dbg service list',
        risk: 'Endpoint 为空（就绪探针全挂）→ 连接直接被拒；conntrack 表满 → 新连接随机失败。',
      },
      {
        id: 'to-pod',
        title: '按 Pod IP 正常转发',
        detail: '之后就走跨节点 Pod 通信那条路：封装或路由、过网络、递交。',
        layer: 'switch',
      },
      {
        id: 'reply',
        title: '回包反向 SNAT',
        detail: '后端 Pod 直接回给客户端 Pod IP，conntrack 在客户端侧把源地址还原成 ClusterIP，客户端才认这个回包。',
        layer: 'peer',
        observe: 'conntrack -L | grep <pod-ip>',
        risk: 'conntrack 条目被清理或超时（长连接空闲太久）→ 回包认不出来，表现为连接莫名中断。',
      },
    ],
  },
  {
    id: 'lb-ingress',
    label: '集群外 → LoadBalancer',
    summary: '裸金属集群里没有云 LB，VIP 靠 ARP 或 BGP 宣告出去。',
    latency: '毫秒级（含公网）',
    takeaway: 'L2 模式下 VIP 只落在一个节点上，是高可用不是负载均衡；要真正分担流量得走 BGP + ECMP。',
    hops: [
      {
        id: 'client',
        title: '客户端解析域名到 VIP',
        detail: '外部 DNS 把域名解析到 MetalLB 分配的那个地址池里的地址。',
        layer: 'app',
        observe: 'kubectl get svc -A | grep LoadBalancer',
      },
      {
        id: 'announce',
        title: 'VIP 是怎么被找到的',
        detail: 'L2 模式：某个 speaker 用 gARP 声称「这个 IP 的 MAC 是我」，全部流量进这一个节点。BGP 模式：多个节点把同一个 /32 宣告给上游路由器，ECMP 分担。',
        layer: 'switch',
        observe: 'kubectl get servicel2statuses -n metallb-system;  arping <vip>',
        risk: '节点带了 exclude-from-external-load-balancers 标签 → speaker 不宣告，VIP 完全不通。',
      },
      {
        id: 'ingress',
        title: 'Ingress 控制器接住并按 L7 路由',
        detail: '到达 Ingress Nginx 或 Gateway 之后，按 Host 与 Path 挑出后端 Service，TLS 也在这里终止。',
        layer: 'kernel',
        observe: 'kubectl logs -n ingress-nginx <pod> | tail;  kubectl get ingress -A',
        risk: '证书过期或 SNI 不匹配 —— 表现是 TLS 握手失败，而不是网络不通。',
      },
      {
        id: 'to-svc',
        title: '转发到后端 Pod',
        detail: 'Ingress 控制器通常直接用 EndpointSlice 里的 Pod IP，跳过 Service 的 DNAT。',
        layer: 'peer',
        observe: 'kubectl get endpointslices -l kubernetes.io/service-name=<svc>',
      },
      {
        id: 'srcip',
        title: '源 IP 保留与否',
        detail: 'externalTrafficPolicy: Cluster 会做 SNAT，后端看到的是节点 IP；改成 Local 能保留客户端真实 IP，代价是只有跑着后端 Pod 的节点才宣告 VIP。',
        layer: 'kernel',
        risk: 'Local 模式下后端 Pod 分布不均 → 流量倾斜到少数节点。',
      },
    ],
  },
  {
    id: 'rdma-write',
    label: 'RDMA WRITE（RoCEv2）',
    summary: '同一条物理链路，把内核整段摘出去之后剩下什么。',
    latency: '个位数微秒',
    takeaway: 'RDMA 快在省掉了协议栈、拷贝和上下文切换；代价是它假设网络不丢包，所以 PFC/ECN 必须配对。',
    hops: [
      {
        id: 'post',
        title: '应用向 QP 投递 WR',
        detail: '用户态直接把工作请求写进队列对（QP）的门铃寄存器，不走系统调用，不进内核。内存必须提前注册成 MR 并锁住。',
        layer: 'app',
        observe: 'ibv_devinfo;  rdma resource show qp',
        risk: '内存注册失败（锁内存额度不足，容器里要给 IPC_LOCK）→ 应用起不来。',
      },
      {
        id: 'hca',
        title: '网卡自己读内存并封装',
        detail: 'HCA 通过 DMA 直接取数据，在硬件里完成 RDMA 传输层封装。整条路径上 CPU 一次都没参与搬运。',
        layer: 'driver',
        observe: 'show_gids | grep v2;  ibstat',
        risk: 'GID index 选错 → 走了 RoCEv1 或错误的 IP 版本，连不上或性能异常。',
      },
      {
        id: 'roce-hdr',
        title: 'RoCEv2 封装：UDP 4791',
        detail: '外层是普通 IP/UDP（目的端口固定 4791），所以它能被三层网络路由，也能被普通交换机转发 —— 前提是全路径按 DSCP 给它单独一个无损队列。',
        layer: 'wire',
        observe: 'tcpdump -i bond0 -nn udp port 4791 -c 10;  mlnx_qos -i <dev>',
        risk: 'DSCP/PCP 映射没端到端对齐 → RDMA 流量掉进普通队列，一拥塞就丢包，带宽断崖式下跌。',
      },
      {
        id: 'lossless',
        title: '交换机无损队列',
        detail: '队列涨到阈值时交换机给上游发 PFC 反压帧让它停一停，同时用 ECN 标记通知发送端降速。ECN 是主力，PFC 是最后防线。',
        layer: 'switch',
        observe: 'ethtool -S <dev> | grep -iE "pause|prio.*pfc";  nstat | grep -i ecn',
        risk: '只配 PFC 不配 ECN → 反压层层向上传导，形成 PFC 风暴甚至死锁，整个 fabric 一起卡住。',
      },
      {
        id: 'remote-dma',
        title: '对端网卡直接写进目标内存',
        detail: '对端 CPU 完全不知情，也不需要被打扰。WRITE 操作是单边的，发起方一侧拿到完成事件即结束。',
        layer: 'peer',
        observe: 'ib_write_bw / ib_write_lat 对打测试',
        risk: 'MTU（IB 侧的 active_mtu）两端不一致 → 建链成功但传输报错。',
      },
    ],
  },
  {
    id: 'gpudirect',
    label: 'GPUDirect RDMA',
    summary: '连主存也不经过了：网卡直接读写显存。',
    latency: '个位数微秒',
    takeaway: '没开 GPUDirect 时数据要在显存和主存之间多跑一趟；开了之后 PCIe 上只有网卡和 GPU 在对话。',
    hops: [
      {
        id: 'nccl',
        title: 'NCCL 决定用哪条通道',
        detail: '机内优先走 NVLink，跨机走 IB/RoCE。这个决策写在初始化日志里，是判断「到底走没走 RDMA」的第一手证据。',
        layer: 'gpu',
        observe: 'NCCL_DEBUG=INFO NCCL_DEBUG_SUBSYS=INIT,NET,GRAPH ./all_reduce_perf ...',
        risk: 'NCCL_IB_HCA 写错或 NCCL_IB_DISABLE=1 → 静默回退 TCP，功能全对、带宽只剩几分之一。',
      },
      {
        id: 'peermem',
        title: '显存被注册成可 DMA 的内存',
        detail: 'nvidia-peermem 把显存暴露给 RDMA 子系统，网卡因此能拿到显存的物理地址直接访问。',
        layer: 'gpu',
        observe: 'lsmod | grep peermem;  nvidia-smi topo -m',
        risk: '模块没加载 / PCIe ACS 没关 / 网卡与 GPU 不在同一个 PCIe switch 下 → 静默退化成走主存。',
      },
      {
        id: 'pcie',
        title: 'PCIe peer-to-peer 传输',
        detail: '网卡通过 PCIe 直接读显存，不经过 CPU 也不经过主存。这就是要求「网卡和 GPU 挂在同一个 PCIe switch 下」的原因。',
        layer: 'driver',
        observe: 'nvidia-smi topo -m   # 看 GPU 与 NIC 之间是不是 PIX/PXB',
        risk: '跨 NUMA 或跨 CPU socket 访问 → 延迟涨、带宽降，拓扑亲和性没配对是常见原因。',
      },
      {
        id: 'rail',
        title: '沿 rail 上行',
        detail: 'rail-optimized 布线下，同一个 rail 的网卡都接在同一组 leaf 上，同 rail 通信只有一跳。',
        layer: 'switch',
        risk: '布线接错 rail → 同 rail 流量被迫上 spine，AllReduce 带宽腰斩。',
      },
      {
        id: 'remote-gpu',
        title: '写进对端显存',
        detail: '对端网卡直接把数据落进目标 GPU 的显存，梯度就这样在两台机器之间流动，主机侧的 CPU 全程没参与。',
        layer: 'peer',
        observe: 'busbw 与理论峰值对比：≥90% 合格，<80% 要查',
      },
    ],
  },
  {
    id: 'ssh-socks',
    label: 'SSH 动态转发（SOCKS5）',
    summary: '一条 ssh -D 就能让本机变成 SOCKS5 代理，出口在服务器那一侧。',
    latency: '一个 RTT 起步',
    takeaway: '出口 IP 与 DNS 解析都发生在服务器侧（用 socks5h 时）；中间网络只看到一条普通的 22 端口加密流量。',
    hops: [
      {
        id: 'client-app',
        title: '应用按 SOCKS5 协议交出目标地址',
        detail: '浏览器或 curl 先和本地 1080 端口握手，告诉它「我要连 example.com:443」。注意应用必须自己会说 SOCKS5，不是所有程序都支持。',
        layer: 'app',
        observe: 'curl --socks5-hostname localhost:1080 https://example.com',
        risk: '用 socks5 而不是 socks5h 时域名在本地解析 —— 本地 DNS 拿到的结果可能是错的或被污染的。',
      },
      {
        id: 'local-listener',
        title: 'ssh 客户端在本地监听',
        detail: '`ssh -D 1080` 让 ssh 进程自己开一个 SOCKS5 服务端口。默认只绑在 localhost 上，别的机器连不过来。',
        layer: 'app',
        observe: 'ss -lntp | grep 1080',
        risk: '端口被占用会直接启动失败；想给局域网用要显式写 `-D 0.0.0.0:1080`，同时自己承担开放代理的风险。',
      },
      {
        id: 'ssh-channel',
        title: '请求被封装成 SSH channel',
        detail: '所有代理请求复用同一条已建立的 SSH 连接，各自是一个 channel。这也意味着它们共享一条 TCP 连接的拥塞窗口。',
        layer: 'kernel',
        observe: 'ssh -v -D 1080 host   # 看 channel 的开关日志',
        risk: '底层单条 TCP 丢包会造成队头阻塞，所有 channel 一起卡 —— 高丢包链路上 SSH 隧道的体验会明显差于多连接方案。',
      },
      {
        id: 'transit',
        title: '在中间网络上就是普通 SSH 流量',
        detail: '对路径上的设备而言，这只是一条到 22 端口的加密连接，看不出里面在代理什么。',
        layer: 'wire',
        observe: 'tcpdump -i any -nn tcp port 22 -c 10',
        risk: '长时间空闲会被中间设备的会话表回收，表现为隧道「用着就断」。用 ServerAliveInterval 保活。',
      },
      {
        id: 'server-exit',
        title: '远端 sshd 代表你发起连接',
        detail: '真正的出站连接由服务器发起，目标服务看到的源地址是服务器的地址；用 socks5h 时域名也在这一侧解析。',
        layer: 'peer',
        observe: '在服务器上：ss -tnp | grep sshd',
        risk: 'sshd 侧禁用了 AllowTcpForwarding 时动态转发直接不可用，日志里会明确写出来。',
      },
      {
        id: 'target',
        title: '目标服务回包，沿原路返回',
        detail: '回程走同一条 SSH 连接回到本机，再由 ssh 交还给发起请求的应用。',
        layer: 'peer',
      },
    ],
  },
  {
    id: 'wireguard',
    label: 'WireGuard 隧道',
    summary: '应用完全不知道自己在用 VPN：它只是往一张普通网卡上发包。',
    latency: '接近物理 RTT',
    takeaway: 'WireGuard 的路由决策靠 AllowedIPs（Cryptokey Routing）：它既是「发给谁」也是「允许谁发来」，配错就静默丢包。',
    hops: [
      {
        id: 'app-send',
        title: '应用往对端内网地址发包',
        detail: '应用调用一次普通的 `send()`，目的地址是 10.0.0.2 这种隧道内地址。没有任何 VPN 相关的 API。',
        layer: 'app',
        observe: 'ip route get 10.0.0.2',
      },
      {
        id: 'wg-route',
        title: '路由表把包交给 wg0',
        detail: 'wg-quick 会按 AllowedIPs 自动装好路由。包进入 wg0 这张虚拟网卡后，才轮到 WireGuard 处理。',
        layer: 'kernel',
        observe: 'wg show;  ip -d link show wg0',
        risk: '目的地址不在任何 peer 的 AllowedIPs 里 → 直接丢弃。这是最常见的「配置全对但不通」。',
      },
      {
        id: 'wg-encrypt',
        title: '查 Cryptokey Routing 表并加密',
        detail: '按目的 IP 找到对应 peer 的公钥，用 ChaCha20-Poly1305 加密，封装成一个 UDP 报文发往该 peer 的 Endpoint。',
        layer: 'kernel',
        observe: 'wg show wg0 transfer   # 看每个 peer 的收发字节',
        risk: '没给 wg0 减 MTU（典型 1420）→ 封装后超过物理 MTU，小包正常、大包卡死。',
      },
      {
        id: 'udp-transit',
        title: '以 UDP 穿过公网',
        detail: '外层只有一个 UDP 报文（默认 51820），没有握手可辨识的连接状态，也没有明显的协议特征。',
        layer: 'wire',
        observe: 'tcpdump -i any -nn udp port 51820 -c 10',
        risk: 'UDP 被整体阻断时 WireGuard 完全不通，而且它不会自动降级 —— 这种网络里要在外面再套一层 TCP 隧道。',
      },
      {
        id: 'peer-verify',
        title: '对端解密并按 AllowedIPs 校验来源',
        detail: '解密后再反查一次：这个源地址是否属于该 peer 被允许的网段。不属于就丢掉。未通过认证的包一律不回应，所以 WireGuard 端口扫不出来。',
        layer: 'peer',
        observe: 'wg show   # latest handshake 时间是最有用的一行',
        risk: '两端 AllowedIPs 不对称（一边写了 /24 一边只写 /32）→ 单向通、回不来。',
      },
      {
        id: 'peer-deliver',
        title: '交给对端协议栈或继续转发',
        detail: '如果对端是子网路由器（subnet router / exit node），它会在这里做转发和 NAT，把流量送进真正的内网或公网。',
        layer: 'peer',
        observe: 'sysctl net.ipv4.ip_forward;  iptables -t nat -L POSTROUTING -n',
        risk: '忘了开 ip_forward 或没配 MASQUERADE → 隧道通、但访问不了对端内网的其它机器。',
      },
    ],
  },
]

export function getScenario(id: string) {
  return SCENARIOS.find((s) => s.id === id) ?? SCENARIOS[0]
}
