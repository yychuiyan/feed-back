# 反馈站

访问：https://feedback.yychuiyan.com/

GitHub Pages 静态反馈站点，使用 Markdown 保存记录，Cloudflare Worker 接收匿名提交并将描述与附件原子提交到 GitHub。

## 使用

- 反馈描述：多行文本，最多 5000 字。
- 昵称：选填，当前浏览器 localStorage 保存，下次自动填写。昵称与访客 UUID 随提交一起存入 Markdown；昵称可重复，浏览器标识不能作为身份认证。换设备、无痕或清除站点数据后不会自动恢复。存储受限时仍可提交，但无法记忆。
- 唯一编号：每条反馈由服务端生成 UUID，列表展示完整编号并支持复制。访客 UUID 区分同名昵称，不代替反馈编号。
- 类型：需求、问题。
- 附件：位于类型下方，最多 5 个，总计 10 MB；支持 PNG/JPG/WebP/GIF/PDF/TXT/LOG/ZIP。
- 提交时服务端强制设置为待处理。网页只展示处理结果，没有修改接口。
- 反馈按提交时间倒序展示，可筛选处理结果。
- 数据和附件公开，不要提交隐私资料。

## 本地预览与验证

```sh
npm ci
npm test
npm run build
npm run dev
```

打开 http://127.0.0.1:4173 。空列表代表尚未收到反馈，未植入示例数据。

## GitHub Pages

仓库 Settings → Pages → Source 选择 GitHub Actions。推送 main 后工作流校验 Markdown 并发布 dist。
每次匿名提交都会创建一个 commit，触发站点更新，通常需要约一两分钟；当前页面会立即显示本次提交。

## 匿名提交服务

```sh
npx wrangler login
npx wrangler secret put GITHUB_TOKEN
npm run deploy:api
```

`GITHUB_TOKEN` 使用单独创建的 fine-grained PAT，只授予本仓库 **Contents: Read and write**。不得放进 public、Git 或浏览器配置。
在 `wrangler.jsonc` 中配置仓库、分支和允许来源（域名需含 https://）。
将部署返回的 Worker URL 填到 `public/config.js` 的 `apiUrl`，推送 main。
接口 `POST /feedback` 接收 multipart/form-data，字段为 description、type、attachments；不接受客户端指定的处理结果。`GET /health` 返回配置是否就绪。

服务提供来源校验、每 IP 每分钟约 5 次提交限制、隐藏机器人字段、上传格式及大小校验。来源校验不能阻止脚本伪造请求；如收到垃圾反馈，可再接入 Turnstile。
附件以随机编号和固定扩展名保存，与 Markdown 一起提交，避免出现只有附件或只有记录的半次提交。

## 处理反馈

编辑 `feedback/<id>.md` 文件头中的 `status`：`待处理`、`已解决`、`无需处理`。
选择无需处理时填写 `reason`。提交后自动发布，构建会拒绝缺少原因的无需处理记录。
Markdown 正文是反馈描述，文件头使用 JSON 格式（合法 YAML）。见 [数据格式](feedback/README.md)。

## 自定义域名

拿到域名后，在 Pages 设置域名，配置 DNS 并开启 HTTPS；同时将新来源加到 Worker 的 ALLOWED_ORIGINS 后重新部署。
