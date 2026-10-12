# API 怎么接，已经检查了哪些部分

接口资料查阅于 2026-10-12。页面预设方便开始，模型名称可以修改。是否开通、是否有额度、当地能否连接，要看使用者自己的账号和服务。

| 服务 | 实现依据 | 本项目请求方式 |
| --- | --- | --- |
| OpenAI | [Chat Completions](https://developers.openai.com/api/reference/resources/chat)、[GPT-4.1 mini](https://developers.openai.com/api/docs/models/gpt-4.1-mini) | `/v1/chat/completions`、Bearer Key |
| DeepSeek | [首次 API 调用](https://api-docs.deepseek.com/) | `/chat/completions`、Bearer Key，预设 `deepseek-flash` |
| Claude | [Messages API](https://platform.claude.com/docs/en/api/messages/create)、[模型目录](https://platform.claude.com/docs/en/models/overview) | `/v1/messages`、`x-api-key`、版本头；独立适配 system 与 content |
| 豆包 / 方舟 | [官方上下文与 Chat API 示例](https://docs.volcengine.com/docs/ark/context-management?lang=zh) | `/api/v3/chat/completions`、Bearer Key；模型或 Endpoint ID 以账号开通情况为准 |
| 自定义 / 本地 | 使用者提供的 OpenAI Chat Completions 兼容接口 | 本地 HTTP 或远程 HTTPS，明确输入模型名称 |

项目选择 Chat Completions 以复用兼容服务，Claude 使用独立 Messages 适配；不把所有服务都当成同一种协议。

## 模拟服务和浏览器检查

本机静态服务、会话认证、来源限制、配置验证、OpenAI 格式与 Claude 格式的请求和解析、密钥不进入对外配置响应、服务商错误内容不回显，以及断开连接。验证使用模拟响应，不向真实服务发送私人材料或真实 Key。

浏览器验证覆盖三语切换、采集和编辑、AI 结果导入、文字备份恢复、Markdown、打印稿和解释/交接入口。语音输入依赖设备与浏览器，没有在每个设备上实测；Windows 首次下载路径需要实际联网下载条件。

## 需要真实使用再确认的部分

目前没有逐一实测使用者真实账号的余额、模型权限和地域连通性，也没有完成长时间、大规模真实采访。兼容服务的参数支持还需分别核对。

服务仅监听 `127.0.0.1`。在线调用时所选内容会发给配置的服务；Key 默认保存在服务运行内存中，不保存在浏览器项目或导出包。可选本机配置文件由使用者另外提供。
