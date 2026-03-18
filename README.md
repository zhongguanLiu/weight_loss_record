🦾 BODY-OS | 赛博朋克风减脂追踪系统

"System is monitoring your metabolic engine." —— Sarcasm_Protocol_v2.33

BODY-OS (Metabolic Sync) 是一款基于 React 构建的本地化、隐私至上的赛博朋克风体重管理与碳循环追踪应用。把你的身体当作一台精密运转的机甲，用极客的方式完成装甲切割（减脂）任务。

🌐 立即体验 (Live Demo)

对于非开发者或不想折腾的用户，您可以直接访问以下链接，开箱即用：

🔗 **[点击此处立即启动 BODY-OS 终端](https://weight-loss-record.vercel.app/)**

备用网址（可直接复制到浏览器）：`https://weight-loss-record.vercel.app/`

💡 最佳体验建议（沉浸模式）：
> 强烈建议在手机浏览器中打开上述链接，并将其「添加到主屏幕 / 桌面」。从桌面图标启动，您将获得完美避开灵动岛和底部小白条的全屏免打扰原生 App 体验。

🔰 新手必读：关于隐私与安全

Q: 我直接用上面的链接，你能看到我的隐私照片和体重吗？

A: 绝对看不到！连一个字节都看不到。
本系统采用最严格的 Local-First（纯本地化）技术架构。您录入的所有体重数据、照片和解锁密码，都会死死锁在您当前手机的浏览器本地缓存里（IndexedDB），完全不与互联网进行任何数据交换。哪怕有十万人同时点开这个链接，每个人的数据也都是完全物理隔离的。请一万个放心使用。

✨ 核心特性 (Core Features)

🤖 毒舌 AI 副官 (Sarcasm_Protocol_v2.33)
告别枯燥的数字记录。系统会根据你最近的质量波动进行智能判定。变瘦了？系统会夸你成功卸载劣质装甲。吃胖了？准备好迎接 AI 副官的无情嘲讽与阴阳怪气。

🥩 自动碳循环引擎 (Auto Carb-Cycling)
专为减脂党/学生党/租房党设计。系统会自动感知当前是星期几，自动下发当天的【核心原则】、【推荐摄入】与【绝对禁忌】（高碳日 / 低碳日 / 无碳日无缝切换）。

📊 全息动态图表 (Holo-Dashboard)
内置基于 recharts 的霓虹光效趋势面积图，搭配背景动态呼吸光斑，提供沉浸式的赛博空间 UI 体验。

📸 蜕变时光机 (Visual Log)
减脂不能只看体重秤。支持上传打卡照片，通过赛博风格的滑块，直观对比机体轻量化前后的视觉差距。

💾 便携式离线存档 (Backup & Restore)
⚠️ 高能预警： 因为数据绝对不上云，如果您清理了手机浏览器缓存或更换新手机，数据将会丢失！请务必定期点击主界面右上角的 ⬇️ 按钮导出 .json 备份。换手机后点击 ⬆️ 即可无损恢复。

🚀 给开发者的部署指南 (Deploy Your Own)

如果你是一名开发者，不想共用公共链接，想要白嫖云服务拥有完全属于你自己的私人部署版本？只需 2 分钟即可免费拥有：

复刻代码：登录你的 GitHub 账号，点击本仓库右上角的 Fork 按钮，将代码复刻到你的名下。

连接云平台：登录 Vercel 或 Netlify，使用 GitHub 账号授权登录。

导入项目：点击 Add New Project，选择你刚刚 Fork 过去的 weight_loss_record 仓库。

⚠️ 配置环境变量 (极度重要)：

在部署设置 (Deploy Settings) 中，找到 Environment Variables。

添加 Name: CI ，Value: false。（用于跳过严格的 ESLint 未使用变量检查）。

一键上线：点击 Deploy，等待 1 分钟即可获得你专属的独立链接！

🛠️ 本地开发 (Local Setup)

如果你想在本地修改这套系统的 UI 或逻辑，请确保你的环境已安装 Node.js。

# 1. 克隆你的仓库
git clone [https://github.com/你的用户名/weight_loss_record.git](https://github.com/你的用户名/weight_loss_record.git)
cd weight_loss_record

# 2. 安装依赖包 (核心依赖: react, recharts, lucide-react, tailwindcss)
npm install

# 3. 启动本地热重载开发环境
npm start

# 4. 构建生产环境静态文件
npm run build


⚠️ 免责声明 (Disclaimer)

本应用的碳循环食谱推荐和 AI 评价系统仅供娱乐、督促和参考，不构成任何专业医疗、营养学建议。机体改造过程请务必量力而行，如遇核心温度过高（发烧）、能量枯竭（低血糖）或任何生理不适，请立即停止所谓计划并寻求专业医疗辅助。

<div align="center">
<p><i>Built with React & ☕ & 🦾</i></p>
</div>