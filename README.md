# LittleMelon Image

LittleMelon Image 是一个中文 AI 生图网站 MVP，重点服务电商产品图、AI 修图、专利制图标准线条图和 GPT-Image-2 创意案例浏览。

## 已实现

- 注册、邮箱验证、登录和用户会话。
- 注册后 1 次免费试用，仅限 1 张 1K 文生图。
- GPT-Image-2 生图适配器，支持管理员后台填写 API Key、中转地址、模型名和并发上限。
- 只支持 `1K / 2K / 4K`，无 8K 入口。
- 积分规则：`1K=1`、`2K=2`、`4K=4`。
- 套餐：Free、Plus `9.9 元 / 100 积分`、Pro `99 元 / 1500 积分`、随买随用 `0.5/1/2 元`。
- 参考图限制：Free 0 张，Plus 2 张，Pro/随买随用 3 张。
- Plus/Pro 支持一个提示词一次生成 2 张。
- 生成前预扣积分，失败自动退回。
- 最近 5 张历史和原图下载。
- 创意案例无限加载、最新/热度排序、中英文切换入口、会员收藏最多 100 张。
- GitHub 创意案例同步：固定同步 YouMind、EvoLinkAI、PicoTrex、wuyoscar，并可发现更多 GPT-Image-2 / image2 仓库。
- 后台支持上传微信/支付宝收款码，管理员确认到账后自动发放对应积分。
- 支付宝异步通知入口：`/api/payments/alipay-notify`，配置 App ID 和支付宝公钥后可自动验签发积分。

## 本地运行

```bash
copy .env.example .env
npm install
npx prisma db push
npm run admin:ensure
npm run sync:gallery
npm run dev
```

本地预览地址：

```text
http://localhost:3012
```

默认超级管理员：

```text
admin@littlemelon.local
LittleMelon@2026
```

上线前请在 `.env` 里修改 `ADMIN_EMAIL` / `ADMIN_PASSWORD` 后重新执行 `npm run admin:ensure`。

## 关键环境变量

- `DATABASE_URL`：数据库地址，当前 MVP 默认 SQLite，适合 2 核 2G VPS 起步。
- `NEXTAUTH_URL`：站点地址，生产必须改成你的 HTTPS 域名。
- `NEXTAUTH_SECRET`：登录会话密钥。
- `OPENAI_API_KEY`：GPT-Image-2 或中转 API Key。
- `OPENAI_BASE_URL`：中转 API 地址。
- `OPENAI_IMAGE_MODEL`：默认 `gpt-image-2`。
- `MAX_CONCURRENT_GENERATIONS`：生成并发上限，2 核 2G VPS 建议 1 到 2。
- `GITHUB_TOKEN`：可选，提高 GitHub 同步限额。
- `ALIPAY_APP_ID` / `ALIPAY_PRIVATE_KEY`：可选，也可以在后台填写。

## 邮箱认证

开发阶段可用注册页返回的本地验证链接。

正式上线建议在后台填写 SMTP：

- Host：邮件服务商 SMTP 地址。
- 端口：SSL 常用 `465`，STARTTLS 常用 `587`。
- 用户名/密码：邮件服务商提供的 SMTP 账号或授权码。
- 发件人：如 `LittleMelon Image <no-reply@你的域名>`。

## 支付宝自动发积分

可以自动发放积分，条件是：

- 你有支付宝开放平台应用。
- 网站已部署到 HTTPS 域名。
- 后台填写 Alipay App ID、应用私钥、支付宝公钥。
- 支付订单的 `out_trade_no` 使用本系统订单号。
- 支付宝异步通知地址填写：`https://你的域名/api/payments/alipay-notify`。

系统收到支付宝 `TRADE_SUCCESS` 或 `TRADE_FINISHED` 后会验签、幂等确认订单并发放积分。

## 同步 GitHub 创意案例

本地或服务器手动同步：

```bash
npm run sync:gallery
```

建议服务器每天自动同步一次：

```bash
0 3 * * * cd /var/www/littlemelon-image && npm run sync:gallery >> logs/gallery-sync.log 2>&1
```

## 生产部署建议

- VPS 配置 2 核 2G 时，先使用 Docker + Next.js + SQLite，生成并发设为 1。
- 图片长期保存建议后续接 S3 兼容对象存储，避免数据库变大。
- 用户量上来后再换 PostgreSQL + Redis，不建议第一版就把 VPS 压满。
