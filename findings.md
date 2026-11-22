# Findings

- 目录为空，无 Git 仓库。GitHub CLI 已登录 yychuiyan。
- 用户指定静态站点、GitHub 托管，后续提供域名；不使用 Sites 托管。
- GitHub Pages 无写入服务。已询问使用 GitHub Issues（登录提交）或额外匿名数据服务。
- 页面采用白底、墨蓝文字、钴蓝主色，表单在上、反馈列表在下；处理状态只读。
- 用户确认 Markdown + 附件，面向访客匿名提交，允许服务端写 GitHub；有 Cloudflare 账号稍后登录。
- 已解释提交最终是 GitHub commit，服务用于保管写入凭据，静态页面仍 GitHub Pages。

- Cloudflare 登录成功，Worker 已部署 https://feed-back-api.yychuiyan.workers.dev ，等待专用 GitHub token。
- GitHub Pages 的账户已有域名，API 返回 http://docs.yychuiyan.com/feed-back/；需核实访问。

- 用户指定域名 feedback.yychuiyan.com，开始配置 GitHub Pages CNAME 和 Worker 来源。

- 专用 GitHub token 已生效，生产环境匿名提交链路验收通过。当前正式域名 https://feedback.yychuiyan.com/ 。

- 新需求：移动适配、唯一标识和昵称记忆。保留服务端 UUID 作为反馈主键；新增客户端浏览器 UUID 与选填昵称，本地 localStorage 记忆，每次提交写入 MD，兼容旧记录。
- 昵称及访客标识仅作区分，无法验证身份；跨设备、无痕或清除存储后不恢复。
