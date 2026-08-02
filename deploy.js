/**
 * 饭点打卡 APP - 一键部署脚本
 * 
 * 使用方法：
 *   1. 打开 Windows 终端（PowerShell 或 CMD）
 *   2. cd 到本目录: cd meal-reminder-app
 *   3. 运行: node deploy.js
 * 
 * 部署完成后会输出公网访问地址
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const APP_DIR = __dirname;
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(msg, color = '') {
  console.log(`${color}${msg}${COLORS.reset}`);
}

function logStep(num, msg) {
  console.log(`\n${COLORS.cyan}${COLORS.bold}[步骤 ${num}] ${msg}${COLORS.reset}\n`);
}

function checkCommand(cmd) {
  try {
    execSync(`${cmd} --version`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function runDeployVercel() {
  logStep(1, '检查 Node.js 环境');
  if (!checkCommand('node')) {
    log('  ✗ 未检测到 Node.js，请先安装: https://nodejs.org', COLORS.red);
    return;
  }
  log('  ✓ Node.js 已安装', COLORS.green);

  logStep(2, '安装 Vercel CLI（全局）');
  try {
    execSync('npm install -g vercel', { stdio: 'inherit' });
    log('  ✓ Vercel CLI 安装成功', COLORS.green);
  } catch {
    log('  尝试使用 npx 方式...', COLORS.yellow);
  }

  logStep(3, '部署到 Vercel');
  log('  即将打开浏览器登录 Vercel，请完成授权后回到终端', COLORS.yellow);
  log('  如果已有账号，直接登录；没有账号可用 GitHub 一键注册\n', COLORS.yellow);

  // 使用 vercel --prod 部署，交互式登录
  const vercelBin = checkCommand('vercel') ? 'vercel' : 'npx vercel';
  const child = spawn(vercelBin, ['--prod', '--yes'], {
    cwd: APP_DIR,
    stdio: 'inherit',
    shell: true
  });

  child.on('close', (code) => {
    if (code === 0) {
      console.log('');
      log('  ✓ 部署成功！', COLORS.green);
      log('  查看上面的输出获取公网地址（通常为 xxx.vercel.app）', COLORS.green);
      console.log('');
      log('  后续更新只需在本目录运行: vercel --prod', COLORS.cyan);
    } else {
      log('  ✗ 部署失败，请检查上面的错误信息', COLORS.red);
      log('  或尝试 GitHub Pages 方案: node deploy.js github', COLORS.yellow);
    }
  });
}

function runDeployGithub() {
  logStep(1, '检查 Git 环境');
  if (!checkCommand('git')) {
    log('  ✗ 未检测到 Git，请先安装: https://git-scm.com', COLORS.red);
    return;
  }
  
  const gitName = execSync('git config --global user.name', { encoding: 'utf8' }).trim();
  const gitEmail = execSync('git config --global user.email', { encoding: 'utf8' }).trim();
  log(`  ✓ Git 已配置: ${gitName} <${gitEmail}>`, COLORS.green);

  logStep(2, '初始化 Git 仓库');
  try {
    if (!fs.existsSync(path.join(APP_DIR, '.git'))) {
      execSync('git init', { cwd: APP_DIR, stdio: 'inherit' });
    }
    execSync('git add -A', { cwd: APP_DIR, stdio: 'inherit' });
    execSync('git commit -m "feat: meal reminder PWA app"', { cwd: APP_DIR, stdio: 'inherit' });
    log('  ✓ 代码已提交', COLORS.green);
  } catch (e) {
    log('  (代码已是最新，无需重新提交)', COLORS.yellow);
  }

  logStep(3, '创建 GitHub 仓库并推送');
  console.log('');
  log('  请按以下步骤操作:', COLORS.bold);
  console.log('');
  log('  1. 打开 https://github.com/new', COLORS.cyan);
  log('     - Repository name: meal-reminder-app', COLORS.cyan);
  log('     - 选择 Public（公开）', COLORS.cyan);
  log('     - 不要勾选 README/gitignore', COLORS.cyan);
  log('     - 点击 Create repository', COLORS.cyan);
  console.log('');
  log('  2. 复制你的仓库地址，格式如:', COLORS.cyan);
  log('     https://github.com/你的用户名/meal-reminder-app.git', COLORS.cyan);
  console.log('');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question('  请粘贴你的 GitHub 仓库地址: ', (repoUrl) => {
    repoUrl = repoUrl.trim();
    if (!repoUrl) {
      log('  ✗ 未输入仓库地址', COLORS.red);
      rl.close();
      return;
    }

    try {
      // 添加远程仓库并推送
      execSync('git remote remove origin', { cwd: APP_DIR, stdio: 'pipe' });
    } catch {}

    try {
      execSync(`git remote add origin ${repoUrl}`, { cwd: APP_DIR, stdio: 'inherit' });
      execSync('git branch -M main', { cwd: APP_DIR, stdio: 'inherit' });
      execSync('git push -u origin main', { cwd: APP_DIR, stdio: 'inherit' });
      log('  ✓ 代码已推送到 GitHub', COLORS.green);
    } catch (e) {
      log('  ✗ 推送失败，请检查仓库地址和权限', COLORS.red);
      log('  如果使用 HTTPS，需要 Personal Access Token 作为密码', COLORS.yellow);
      log('  创建 Token: https://github.com/settings/tokens', COLORS.yellow);
      rl.close();
      return;
    }

    logStep(4, '启用 GitHub Pages');
    console.log('');
    log('  代码已推送！现在启用 Pages:', COLORS.bold);
    console.log('');
    log('  1. 打开你的仓库: ' + repoUrl.replace('.git', ''), COLORS.cyan);
    log('  2. 点击 Settings → Pages', COLORS.cyan);
    log('  3. Source 选择 Deploy from a branch', COLORS.cyan);
    log('  4. Branch 选择 main，文件夹选 / (root)', COLORS.cyan);
    log('  5. 点击 Save', COLORS.cyan);
    console.log('');
    log('  等待 1-2 分钟后，你的 APP 将可通过以下地址访问:', COLORS.green);
    const username = repoUrl.match(/github\.com\/([^\/]+)/);
    if (username) {
      log(`  https://${username[1]}.github.io/meal-reminder-app/`, COLORS.bold + COLORS.green);
    }
    console.log('');
    log('  后续更新代码后，只需运行: git push', COLORS.cyan);
    
    rl.close();
  });
}

function runDeployNetlify() {
  logStep(1, '检查 Node.js 环境');
  if (!checkCommand('node')) {
    log('  ✗ 未检测到 Node.js，请先安装: https://nodejs.org', COLORS.red);
    return;
  }
  log('  ✓ Node.js 已安装', COLORS.green);

  logStep(2, '安装 Netlify CLI');
  try {
    execSync('npm install -g netlify-cli', { stdio: 'inherit' });
    log('  ✓ Netlify CLI 安装成功', COLORS.green);
  } catch {
    log('  ✗ 安装失败，请检查网络', COLORS.red);
    return;
  }

  logStep(3, '登录 Netlify');
  log('  即将打开浏览器登录 Netlify', COLORS.yellow);

  const child = spawn('netlify', ['login'], {
    cwd: APP_DIR,
    stdio: 'inherit',
    shell: true
  });

  child.on('close', (code) => {
    if (code !== 0) {
      log('  ✗ 登录失败', COLORS.red);
      return;
    }
    log('  ✓ 登录成功', COLORS.green);

    logStep(4, '部署到 Netlify');
    const deploy = spawn('netlify', ['deploy', '--prod', '--dir=.'], {
      cwd: APP_DIR,
      stdio: 'inherit',
      shell: true
    });

    deploy.on('close', (code) => {
      if (code === 0) {
        console.log('');
        log('  ✓ 部署成功！', COLORS.green);
        log('  查看上面的输出获取公网地址（通常为 xxx.netlify.app）', COLORS.green);
        console.log('');
        log('  后续更新只需运行: netlify deploy --prod --dir=.', COLORS.cyan);
      } else {
        log('  ✗ 部署失败', COLORS.red);
      }
    });
  });
}

// ===== Main =====
const platform = process.argv[2] || '';

console.log('');
log('═══════════════════════════════════════════════', COLORS.bold);
log('  🍽️  饭点打卡 APP - 公网部署工具', COLORS.bold + COLORS.green);
log('═══════════════════════════════════════════════', COLORS.bold);
console.log('');

if (platform === 'vercel') {
  runDeployVercel();
} else if (platform === 'github') {
  runDeployGithub();
} else if (platform === 'netlify') {
  runDeployNetlify();
} else {
  log('请选择部署平台:', COLORS.bold);
  console.log('');
  log('  1. Vercel  (推荐) - 全球CDN，国内速度快，自动HTTPS', COLORS.cyan);
  log('     运行: node deploy.js vercel', COLORS.yellow);
  console.log('');
  log('  2. GitHub Pages  - 完全免费，适合有GitHub账号的用户', COLORS.cyan);
  log('     运行: node deploy.js github', COLORS.yellow);
  console.log('');
  log('  3. Netlify - 全球CDN，拖拽部署也很方便', COLORS.cyan);
  log('     运行: node deploy.js netlify', COLORS.yellow);
  console.log('');
  log('提示: 三个平台都是永久免费，Vercel和Netlify国内访问速度更好', COLORS.yellow);
}
