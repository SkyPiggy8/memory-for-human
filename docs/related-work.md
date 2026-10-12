# 参考项目与 MFH 的设计取舍

[简体中文](related-work.md) · [English](related-work.en.md) · [Español](related-work.es.md)

写回忆录，难处往往出现在开始之前和写完之后：家人不知道怎么提问，讲述者记不清年份，旧材料散在不同地方，稿子写好后又不知道怎么保存、打印。MFH 把这些步骤接在一起，面向能讲故事、但不想研究开发环境的使用者。

这次参考了三个项目。StorySage 与 memoir 的说明和部分源码查阅于 2026-10-13，下面给出固定提交链接；没有运行它们，因此不比较实际效果、速度或模型准确率。Lorevox 的当前链接无法读取，单独注明资料范围。

## 三条已有路线

| 项目 | 能从资料中确认的设计 | MFH 从中得到的启发 |
| --- | --- | --- |
| [StorySage](https://github.com/ShayanTalaei/StorySage/blob/12f3c9148a3d73e96f61737d9f04d354f08e4dde/readme.md) | 采访、记录、规划、分节写作和后续会话由不同 agent 分工；源码提供 FAISS 与 OpenAI embeddings 的记忆检索实现 | 采访和写作可以分开处理；问题应该接着已有记忆走 |
| [Taoyuesong/memoir](https://github.com/Taoyuesong/memoir/blob/83d3cc65fdb16e33e00f116cec47917ee2863c74/README.md) | Rust/Axum、SQLite 与 SvelteKit；工具调用管理事件、人物等记录，ContextBuilder 处理上下文预算和压缩 | 长期采访需要独立的数据结构，不能一直往聊天窗口追加文字 |
| [Lorevox](https://github.com/lorevox-hx/lorevox) | 搜索缓存中的项目说明强调 Archive → History → Memoir、候选事实审阅和分阶段采访；2026-10-13 仓库页面、API 和原始文件均返回 404 | 原始讲述、待核对事实与最终稿应分开。缓存只能提供参考方向，不能证明当前代码和功能状态 |

源码依据：[StorySage 写作编排](https://github.com/ShayanTalaei/StorySage/blob/12f3c9148a3d73e96f61737d9f04d354f08e4dde/src/agents/biography_team/orchestrator.py)、[向量记忆实现](https://github.com/ShayanTalaei/StorySage/blob/12f3c9148a3d73e96f61737d9f04d354f08e4dde/src/content/memory_bank/memory_bank_vector_db.py)；[memoir 工具定义](https://github.com/Taoyuesong/memoir/blob/83d3cc65fdb16e33e00f116cec47917ee2863c74/backend/src/agent/tools.rs)、[上下文管理](https://github.com/Taoyuesong/memoir/blob/83d3cc65fdb16e33e00f116cec47917ee2863c74/backend/src/agent/context.rs)。

## MFH 把工作放在哪里

**让平时使用的 AI 能接手。** 使用者可以复制任务说明和选中的材料，交给自己的聊天工具，再把章节带回来。API 是另一条入口。项目格式和作品保存独立于这两种使用方式，所以不必在开始采访前选定一个服务商。

**按关系组织采访。** 恋人、婚姻、老人一生、战友、同事和同学各有提纲与问题。恋人的一段普通日常，和老人跨几十年的生活经历，需要不同的问法和章节跨度。三种语言目前各有 156 个起始问题，AI 再接着具体回答补问；这部分没有做成自动采访规划器。

**让家人能代操作。** 讲述者可以只负责讲，家人负责记录和读回核对。通俗解释、安装交接和章节回贴都有入口；前端无需构建，Windows 有运行环境准备脚本。这些工作服务于实际操作，不要求讲述者理解 agent、数据库或 token。

**把可带走的作品做完整。** 稳定来源编号、勾选材料、章节修改后重新审阅、追加式恢复，以及文字备份、Markdown、打印和制作清单，都围绕“写完之后怎样继续改、怎样交给家人”设计。照片书、硬件相框和 NAS 提供准备与制作步骤，尚未自动集成。

来源保留、本人确认、本地保存和 AI 采访在其他项目中也有体现；它们不是本项目独有的发明。MFH 的特点在于把六类关系、三语协助、自己的 AI、低依赖本机运行和成品制作放进同一套家庭写作流程。

## 目前的技术侧重点

| 维度 | 参考项目的明确方向 | MFH 当前做法 |
| --- | --- | --- |
| 任务组织 | StorySage 的多 agent 分工 | 四种明确任务，逐次请求；便于手动交接与 API 使用 |
| 长篇上下文 | memoir 的预算与压缩；StorySage 的向量记忆实现 | 人工选材、逐章写作、超限提示；自动摘要与检索待做 |
| 事实确认 | Lorevox 缓存说明中的候选事实审阅 | 来源编号与章节审阅状态；逐条事实审阅尚未实现 |
| 安装方式 | StorySage 的 Python 路径；memoir 的 Rust 与前端开发环境 | 原生网页与 Node.js 内置模块；无 Key 也能开始 |
| 成品准备 | 本次查阅没有系统评测各项目的制作流程 | 文字导出、浏览器打印、书籍与相册制作清单 |

本页说明设计位置，不把文档里没看到的功能判定为对方没有，也不据此宣布整体领先。下一步应找家庭使用者实际完成一章，观察哪些问题能问出细节、哪一步容易丢进度，再用结果改进流程。
