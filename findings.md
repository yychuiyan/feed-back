# Findings

- 目录为空，无 Git 仓库。GitHub CLI 已登录 yychuiyan。
- 用户指定静态站点、GitHub 托管，后续提供域名；不使用 Sites 托管。
- GitHub Pages 无写入服务。已询问使用 GitHub Issues（登录提交）或额外匿名数据服务。
- 页面采用白底、墨蓝文字、钴蓝主色，表单在上、反馈列表在下；处理状态只读。
- 用户确认 Markdown + 附件，面向访客匿名提交，允许服务端写 GitHub；有 Cloudflare 账号稍后登录。
- 已解释提交最终是 GitHub commit，服务用于保管写入凭据，静态页面仍 GitHub Pages。

- Cloudflare 登录成功，Worker 已部署 https://feed-back-api.yychuiyan.workers.dev ，等待专用 GitHub token。
- GitHub Pages 的账户已有域名，API 返回 http://docs.yychuiyan.com/feed-back/；需核实访问。
