# 历史记忆项目 GitHub 部署推送脚本
# 请在 PowerShell 中运行此脚本来完成代码推送

Write-Host "=== 历史记忆项目 GitHub 部署脚本 ===" -ForegroundColor Green
Write-Host ""

# 检查当前分支
Write-Host "检查当前分支状态..."
git branch -a
Write-Host ""

# 设置 Git 用户信息（如果还没有设置）
Write-Host "确保 Git 用户信息已设置..."
git config user.name "历史记忆项目"
git config user.email "history-memory@example.com"
Write-Host "✓ Git 用户信息已设置"
Write-Host ""

# 添加远程仓库
Write-Host "设置远程仓库..."
git remote add origin https://github.com/trusts3596-create/history-memory.git
Write-Host "✓ 远程仓库已设置"
Write-Host ""

# 检查状态
Write-Host "检查 Git 状态..."
git status
Write-Host ""

Write-Host "=== 推送说明 ===" -ForegroundColor Yellow
Write-Host "由于网络连接问题，无法自动推送代码。"
Write-Host "请按以下步骤手动推送："
Write-Host ""
Write-Host "1. 确保您在 main 分支上："
Write-Host "   git checkout main"
Write-Host ""
Write-Host "2. 推送代码到 GitHub："
Write-Host "   git push -u origin main"
Write-Host ""
Write-Host "3. 如果遇到网络错误，请等待几分钟后重试，或检查您的网络连接"
Write-Host ""
Write-Host "4. 推送成功后，请按照以下步骤启用 GitHub Pages："
Write-Host ""
Write-Host "   a) 访问: https://github.com/trusts3596-create/history-memory"
Write-Host "   b) 进入 Settings → Pages"
Write-Host "   c) Source 选择 'Deploy from a branch'"
Write-Host "   d) Branch 选择 'main'"
Write-Host "   e) Directory 选择 '/'"
Write-Host "   f) 点击 'Save'"
Write-Host ""
Write-Host "5. 您的网站将在几分钟内部署完成，访问地址："
Write-Host "   https://trusts3596-create.github.io/history-memory/"
Write-Host ""

# 询问用户是否要尝试推送
$choice = Read-Host "是否要立即尝试推送代码？(y/n)"
if ($choice -eq "y" -or $choice -eq "Y") {
    Write-Host "正在尝试推送代码..."
    git push -u origin main
} else {
    Write-Host "您可以稍后在项目目录运行 'git push -u origin main' 来推送代码"
}

Write-Host "部署脚本执行完成！" -ForegroundColor Green