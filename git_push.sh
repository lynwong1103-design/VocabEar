#!/bin/bash
# 自动提交并推送到 GitHub，在每次上传前执行
cd /Users/ayeshawang/ielts-dictation
git add -A
git commit -m "auto: $(date '+%Y-%m-%d %H:%M')" --allow-empty 2>/dev/null
git push origin main 2>/dev/null || true
echo "✅ GitHub 已同步"
