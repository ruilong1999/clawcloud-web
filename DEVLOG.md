# ClawCloud 开发文档

## 项目概述

ClawCloud 是一个 AI 员工管理平台，让用户可以按需启停 AI "员工"，从而节省云服务费用。

### 技术栈
- 前端框架：纯 HTML + Tailwind CSS (CDN)
- 图标：Font Awesome 6.5.1
- 字体：Inter (Google Fonts)

---

## 项目结构

```
clawcloud-web/
├── index.html      # 单页面应用主文件
└── DEVLOG.md       # 本文档
```

---

## 功能模块

### 1. Dashboard（仪表盘）
- 显示总员工数、正在上班数、今日费用、节省金额
- 员工状态列表（前5名）
- 快速操作面板
- 活动日志
- 费用趋势图表
- 资源使用监控（CPU/内存/存储）

### 2. 员工管理
- 招聘新员工（配置名称、角色、CPU、内存、存储）
- 查看员工详情
- 上下班控制
- 克隆员工
- 删除员工

### 3. 省钱计算器
- 基于 Azure Container Instances 定价
- 对比 24/7 托管与按需使用的费用差异

### 4. 账单明细
- 显示每个员工的今日费用和工作时长
- 统计今日总消费和节省金额

---

## 开发日志

### 2026-03-24 - 价格调整与安全配置

#### 价格调整
- 调整云资源定价到更合理的市场水平
- vCPU: ¥0.27/小时 → ¥0.50/小时
- 内存: ¥0.03/GB/小时 → ¥0.15/GB/小时
- 存储: ¥0.15/GB/月 → ¥0.50/GB/月
- 基础版套餐: ¥0.66/小时 → ¥1.60/小时
- 标准版套餐: ¥1.32/小时 → ¥3.20/小时
- 专业版套餐: ¥2.64/小时 → ¥6.40/小时

#### 安全配置
- 添加完整的 HTTPS/SSL 配置模板
- 添加 HTTP → HTTPS 自动重定向
- 添加安全响应头（HSTS、X-Frame-Options、CSP 等）
- 更新部署文档，添加 Let's Encrypt 证书获取说明

---

## 部署说明

### 本地开发
直接用浏览器打开 `index.html` 即可，无需服务器。

### 生产部署（Nginx + HTTPS）

#### 前置要求
- 已注册域名
- 服务器 80 和 443 端口已开放
- 已安装 Nginx

#### 1. 安装 Certbot（Let's Encrypt）

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

**CentOS/RHEL:**
```bash
sudo yum install certbot python3-certbot-nginx
```

#### 2. 配置 Nginx

1. 复制 `nginx.conf` 内容到 Nginx 配置：
```bash
sudo nano /etc/nginx/sites-available/clawcloud
# 粘贴 nginx.conf 内容，记得替换 your-domain.com
```

2. 启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/clawcloud /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 3. 获取 SSL 证书

```bash
# 自动配置 HTTPS
sudo certbot --nginx -d your-domain.com

# 或手动获取证书后再配置
sudo certbot certonly --nginx -d your-domain.com
```

Certbot 会自动：
- 获取免费 SSL 证书
- 配置 Nginx HTTPS
- 设置自动续期

#### 4. 验证配置

访问 `https://your-domain.com`，浏览器地址栏应显示锁图标。

#### 5. 证书自动续期

Certbot 已自动配置 systemd timer，可手动验证：
```bash
sudo certbot renew --dry-run
```

---

## Bug 修复记录

### 2026-03-24 - 价格与安全问题
- **问题**: 定价过低（6G 内存月费仅约 ¥13），不符合市场水平
- **解决**: 全面调整资源定价，参考主流云服务商价格
- **问题**: 网站访问时浏览器提示"不安全"
- **解决**: 添加 HTTPS/SSL 配置模板和安全响应头

---

## 待办事项

- [ ] 添加数据持久化（localStorage 或后端 API）
- [ ] 添加用户认证
- [ ] 接入真实的 Azure Container Instances API
- [ ] 添加微信/Telegram/Discord 渠道连接
- [ ] 多语言支持

---

## 定价参考（云容器实例）

- vCPU: ¥0.50/小时
- 内存: ¥0.15/GB/小时
- 存储: ¥0.50/GB/月
