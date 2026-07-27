# 旅行手帐 · Passport Journal

一本护照形状的旅行记录本。翻开第一页是你自己，往后每去一个地方就多一页，
你在那里遇到的人、吃过的东西、留下的物件，都盖在那一页上。

**在线试用：** _(部署后把网址填在这里)_

---

## 为什么做这个

现有的旅行记录工具都在解决「怎么记得更全」——时间线、打卡、自动定位、
一天生成一篇游记。但旅行结束半年后，真正被反复想起的从来不是完整行程，
而是几个碎片：某个人、某样吃的、某张车票。

所以这个产品换了个前提：**不追求记全，只记住值得记的碎片，并且给它们一个
好看的容器。**

护照是这个前提最自然的形状。它天然是按时间累积的，天然是一页一个地方，
天然带着「盖章」这个动作——记录一件事，就是往这一页上添一枚印记。

## 核心机制

**竖着读，是一本护照。** 资料页 → 目录 → 一个个地点页 → 库 → 地图。
每页顶上有一枚入境章，角度和油墨颜色由地点推导，同一个地方每次打开都一样，
不同地方之间又有细微差别，像真的一枚枚盖上去的。

**横着读，是几个收藏库。** 不分地点，把所有「人物」放在一起、所有「食物」
放在一起。一本册子因此有两种读法。

**人物会串起来。** 同一个人出现在不同地方时，可以确认成同一个人，
他的轨迹会画在地图页上。这是整个产品里唯一一个「因为记录得多，
所以看到了原本看不到的东西」的地方。

## 做过的取舍

| 决定 | 理由 |
|---|---|
| 主界面是护照，不是世界地图 | 地图是按空间排的，护照是按时间排的。真实的旅行记忆更接近后者 |
| 地图降级成最后一页 | 保留了人物轨迹这个功能，但不让它占住入口，也省掉了瓦片服务和国界数据 |
| 人物识别靠手动确认，不做人脸比对 | 认错人比漏认更难向用户解释。「这是之前在上海的那个小明吗？」比自动合并可控 |
| 分类是全局的，不挂在地点下 | 否则每到一个新地方都要重建一次「人物」「食物」，自定义分类也带不过去 |
| 数据只存在本机，没有账号 | 这是私人记录，不该有服务器副本。代价是必须自己备份，所以备份是第一版功能而不是第三阶段功能 |
| 翻页用横向位移，不做立体翻书 | 3D 翻页在手机上容易显得廉价，而且每页都要滚动时会拖累手感 |
| 照片存 Blob，不存 base64 | base64 会让体积涨三分之一 |

## 已经做完的

- 护照式翻页：封面、资料页、目录、地点页、库、地图页
- 添加地点（内置约 210 个城市，中英文可搜；库里没有的地方也能手填）
- 添加记录：选图 → 方形裁剪 → AI 风格化（可跳过）→ 名称、备注、日期
- 自定义分类：除了预置的人物 / 物件 / 食物，可以自己建库（车票、书、住过的房间……），建一次所有地点通用
- 目录页直达各个库，包括自建的
- 人物跨地点关联与轨迹地图
- 全局搜索（地点、名称、备注）
- 备份导出与恢复
- 可添加到手机主屏幕，全屏运行

## 还没做的

- 导出成 PDF 旅行手册
- 云同步（要不要做还没想清楚，它和「数据只在本机」是冲突的）
- 更细的地图交互

---

## 本地运行

```bash
npm install
npm run dev
```

打开终端里给出的地址（默认 `http://localhost:5173`）。

## 部署

推到 GitHub 之后，在 [Vercel](https://vercel.com) 里 Import 这个仓库，
其余保持默认，直接 Deploy。会得到一个 `https://xxx.vercel.app` 的网址。

### 打开 AI 风格化

AI 功能通过 `api/stylize.js` 转发，密钥留在服务端，前端看不到。
在 Vercel 的 Project Settings → Environment Variables 里加三个变量：

| 变量 | 说明 |
|---|---|
| `AI_API_KEY` | 模型服务的密钥 |
| `AI_ENDPOINT` | 图生图接口地址 |
| `AI_MODEL` | 模型名 |

没配置的话接口返回 501，前端会自动把 AI 那一步隐藏掉，其余功能照常。

**不要把密钥写进前端代码或提交进仓库。**

## 技术栈

React 19 · Vite · Dexie (IndexedDB) · d3-geo + world-atlas · 无后端（除一个转发函数）

地图数据打包在本地，不请求瓦片服务器，所以断网也能画出来，
样式也能和证件纸统一。

---

## English

**Passport Journal** is a travel notebook shaped like a passport. The first page
is you. Every place you visit adds a page, and the people, food, and objects you
collected there get stamped onto it.

Most travel apps optimise for completeness — timelines, check-ins, auto-generated
trip reports. But six months after a trip, what you actually recall is never the
full itinerary. It's a handful of fragments: one person, one meal, one ticket
stub. This app takes that as its premise: don't try to record everything, record
the fragments worth keeping, and give them a container worth opening.

Read it vertically and it's a passport — profile, contents, one page per place,
collections, map. Read it horizontally and it's a set of collections — everyone
you've met, everything you've eaten, across all places. A person who shows up in
two cities can be linked, and their trail is drawn on the map page.

Everything is stored locally in the browser. No account, no server copy, no
upload. The trade-off is that you have to back up yourself, which is why export
shipped in v1 rather than being deferred.

**Run locally:** `npm install && npm run dev`
**Deploy:** import the repo on Vercel, defaults are fine.
**AI stylise:** set `AI_API_KEY`, `AI_ENDPOINT`, `AI_MODEL` as environment
variables — the key stays server-side in `api/stylize.js`. Without them the
endpoint returns 501 and the AI step hides itself.

React 19 · Vite · Dexie (IndexedDB) · d3-geo + world-atlas · no backend.
