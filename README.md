# Memory for Human

用自己的电脑和 AI 写回忆录。可以自己写，也可以帮家人记录。

## 1. 下载后，怎么打开可操作的网页？

**Windows：**

1. [下载 ZIP](https://github.com/SkyPiggy8/memory-for-human/archive/refs/heads/main.zip)，解压。
2. 进入解压后的项目文件夹，双击 **`start.cmd`**。
3. 浏览器会打开网页。点击「开始我的回忆录」，就能填写故事、整理章节和保存。

没有自动打开浏览器，就手动打开 **http://127.0.0.1:4317**。使用时留着启动窗口，用完再关闭。第一次启动可能需要联网下载运行程序，稍等一会儿。

**macOS / Linux：** 安装 Node.js 22 或以上，在项目文件夹中运行 `sh start.sh`。不会操作，就按下一节让自己的 AI 帮忙。

只想先试填几段文字，也可以双击根目录的 **`index.html`**。它能填写和备份，但不能连接 API；需要连接时，用上面的启动方式。换入口前先下载备份，再导入。

## 2. 怎么交给自己的 AI？

**如果你的 AI 能读取文件、操作电脑：** 在它里面打开解压后的项目文件夹，或允许它访问这个文件夹，再复制下面这段话：

```text
这是我下载好的 Memory for Human 项目。
请先读 README.md、AGENTS.md 和 docs/ai-handoff.md，
按我的操作系统启动项目，帮我打开可以填写的网页。
我不懂编程，打开后请带我创建一本回忆录，先记录一段故事。
不要读取或索取我的 API Key，也不要清空已有内容。
如果你不能操作电脑，请告诉我下一步要打开哪个文件。
```

**如果你的 AI 只能聊天：** 先打开上面的网页，点击「交给我的 AI」，选择任务并复制说明，发到你平时使用的 AI 对话里。它写好后，把章节文字贴回网页保存。这种方式不需要 API Key。

具体交接规则在 [docs/ai-handoff.md](docs/ai-handoff.md#handoff)，可以让 AI 读取，也可以把文件内容发给它。

## 网页打开后做什么？

1. 选一种故事：恋人、婚姻与家庭、老人一生、战友、同事或同学。
2. 回答一个问题，或放入已有文字。先记一件小事，不必一次讲完。
3. 整理成一章，自己检查和修改，再下载备份、导出文稿或打印。

想在网页里直接让 AI 提问、写作，就点「连接我的 AI」，选服务并填写自己的 API Key。Key 只在连接窗口填，不要发到聊天里。

文字保存在当前浏览器里，重要内容请点「下载完整文字备份」。调用在线 AI 时，你选中的文字会发给对应服务。录音文件自动转写、照片识别和自动相册制作目前还没有。

## 需要时再看

[使用指南：材料、采访、打印与保存](docs/guide.md) · [六类采访模板](docs/templates.md) · [技术说明与项目对比](docs/technical.md) · [开发计划](docs/development.md#roadmap)

<details>
<summary>项目流程图</summary>

![选择故事、整理材料、逐章写作、本人审阅、制作与保存](assets/overview.svg)

图中包含后续计划。[查看交互流程图](docs/overview.html)

</details>

本项目采用 [PolyForm Noncommercial 1.0.0](LICENSE)，用于非商业用途。[第三方许可说明](docs/THIRD_PARTY_NOTICES.md)。

其他语言：[English](docs/translations/README.en.md) · [Español](docs/translations/README.es.md)（保留版本）。
