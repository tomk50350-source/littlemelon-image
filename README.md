# LittleMelon Image

LittleMelon Image 是一个中文 AI 生图网站 MVP，重点服务电商产品图和 AI 修图。

## 已实现

- 注册、登录和用户会话。
- 注册后 1 次免费试运行。
- GPT-Image-2 生图适配器，未配置 `OPENAI_API_KEY` 时自动使用演示图。
- 专利制图标准线条图入口，支持黑白线稿、结构示意、爆炸图和编号标注提示词。
- 只支持 `1K / 2K / 4K`，无 8K 入口。
- 积分规则：`1K=0.6`、`2K=1`、`4K=2`。
- `9.9 元/月 = 100 积分`，会员积分月底清零。
- 生成前预扣积分，失败自动退回。
- 最近 5 张历史和原图下载。
- 提示词图库、价格页、后台概览。
- GitHub 图库同步：固定同步 YouMind、wuyoscar 两个优质源，并自动搜索发现更多 GPT-Image-2 / image2 创意仓库。
- 微信/支付宝支付接口位置已预留，默认 mock 支付方便本地测试。

## 本地运行

```bash
copy .env.example .env
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

本地预览地址默认是：

```text
http://localhost:3012
```

如果当前 Windows 的全局 `npm` 命令损坏，可临时使用：

```powershell
& 'C:\Program Files\nodejs\node.exe' 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' install
```

## 关键环境变量

- `DATABASE_URL`：数据库地址。默认 SQLite 开发库，生产建议 PostgreSQL。
- `NEXTAUTH_URL`：站点地址。
- `NEXTAUTH_SECRET`：登录会话密钥。
- `OPENAI_API_KEY`：配置后走真实 GPT-Image-2 或你的中转 API。
- `OPENAI_BASE_URL`：可选，中转 API 地址，例如 `https://api.example.com`。
- `OPENAI_IMAGE_MODEL`：默认 `gpt-image-2`。
- `PAYMENT_PROVIDER`：默认 `mock`，生产支付接入后改为真实服务商。
- `GITHUB_SYNC_TOKEN`：后台手动同步 GitHub 图库时使用的保护 token。
- `GITHUB_TOKEN`：可选。用于提高 GitHub 搜索和同步限额，建议服务器生产环境配置。

## 同步 GitHub 图库

同步逻辑不是照搬单个网站，而是：

- 固定优先抓取两个你指定的开源项目，作为高质量基础库。
- 自动在 GitHub 搜索 `gpt-image-2`、`GPT Image 2`、`image2 prompt` 等相关仓库。
- 只纳入名称、简介、主题与 GPT-Image-2 / image2 / prompt / gallery 明确相关的仓库。
- 每次同步会去重、分类，并把最新案例写入前台提示词图库。

本地或服务器手动同步：

```bash
npm run sync:gallery
```

后台 API 手动触发：

```bash
curl -X POST https://你的域名/api/admin/sync-gallery \
  -H "x-sync-token: 你的 GITHUB_SYNC_TOKEN"
```

服务器每天自动同步一次，可加 cron：

```bash
0 3 * * * cd /var/www/littlemelon-image && npm run sync:gallery >> logs/gallery-sync.log 2>&1
```

## 生产部署建议

- 应用：Next.js 部署到你的服务器，前置 Nginx + HTTPS。
- 数据库：PostgreSQL。
- 队列/限流：Redis，用于生成任务队列、用户频率限制和支付回调幂等。
- 图片存储：S3 兼容对象存储或服务器自建 MinIO。
- 支付：微信支付 Native + 支付宝当面付或聚合支付服务商。

## 下一步

- 接入真实微信/支付宝 SDK 和回调验签。
- 把 OpenAI 返回的图片落到对象存储，避免依赖临时 URL。
- 为后台增加管理员权限、图库批量导入、订单搜索和失败任务重试。
- 加 Redis 限流，防止免费试用被刷。
