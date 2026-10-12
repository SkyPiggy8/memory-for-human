# GitHub 仓库与发布

项目仓库：[SkyPiggy8/memory-for-human](https://github.com/SkyPiggy8/memory-for-human)。仓库为 Public，默认分支为 `main`。

## 仓库资料

- 名称：`memory-for-human`
- 简介：Local-first memoirs, guided by your own AI. 中文 / English / Español. Personal, noncommercial use.
- Topics：`memoir`、`oral-history`、`family-history`、`ai-writing`、`local-first`、`personal-archive`
- 许可：项目自身采用 PolyForm Noncommercial 1.0.0，禁止未经授权的商业使用；第三方内容的原许可见 [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md)。

README 提供中文、英文、西班牙语入口；图片和说明文档使用相对路径，随仓库一起下载。用户下载后可双击 `start.cmd` 启动本地工具。

## 更新与检查

本地更新后，按 AGENTS.md 运行相关检查，再提交并推送到自己的分支。`.github/workflows/checks.yml` 会检查核心数据和本机 API 的行为。模拟接口测试不代表已验证真实账号的余额、权限或连通性。

公开仓库保存应用代码、说明、模板、虚构示例与许可。不保存使用者的 API Key、采访资料、真实作品、下载的运行环境或本机配置。

## 每次发布前确认

- [ ] 三语 README 与界面状态一致，已实现和后续能力清楚。
- [ ] 本机配置、密钥、私人材料与真实作品不在提交列表中。
- [ ] 相对链接、图片、许可和第三方声明齐全。
- [ ] HTML 文档预览与 Markdown 同步，不覆盖可操作的根目录 `index.html`。
- [ ] 相关测试通过，没有把模拟响应写成真实服务商实测。

本仓库没有自动把回忆录资料部署到外网的流程。发布 GitHub 源代码与运行使用者的本地应用是两个步骤。
