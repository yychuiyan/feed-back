# 反馈数据

每条反馈保存为独立的 `.md` 文件。文件头为 JSON 格式的 YAML front matter，正文是反馈描述。

维护者可以修改文件头的 `status`，可选：`待处理`、`已解决`、`无需处理`。
`无需处理` 时必须填写 `reason`；构建会校验。不要修改 `id` 和 `createdAt`。

新记录还包含 `nickname`（可空）和 `visitorId`（浏览器 UUID）。昵称是提交时的快照，改昵称不会改写历史反馈；这两个字段均不验证身份。旧记录缺少这两个字段仍可正常展示。
附件保存到 `attachments/<反馈编号>/`。更新处理结果并提交后，GitHub Pages 自动更新。

格式示例（仅说明，不会显示为真实反馈）：

```markdown
---
{
  "id": "fb-example",
  "type": "需求",
  "status": "无需处理",
  "reason": "现有功能已支持，请在设置中开启。",
  "createdAt": "2026-11-22T00:00:00.000Z",
  "attachments": []
}
---

反馈描述正文
```
