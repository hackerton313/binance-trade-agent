// scripts/post-to-square.js
// ينشر منشوراً مع صورة على Binance Square

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function postWithImage(text, imagePath) {
  if (!fs.existsSync(imagePath)) {
    return { success: false, error: `الصورة غير موجودة: ${imagePath}` };
  }

  const apiKey = process.env.BINANCE_SQUARE_OPENAPI_KEY;
  if (!apiKey) {
    return { success: false, error: 'BINANCE_SQUARE_OPENAPI_KEY غير موجود' };
  }

  // استبدل علامات الاقتباس والرموز الخطرة
  const safeText = text
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\$/g, '\\$')
    .replace(/`/g, '\\`');

  const absImagePath = path.resolve(imagePath);
  const absScript = path.resolve('node_modules/.bin/../..', 'scripts/post-image.mjs');

  // ابحث عن post-image.mjs في عدة مواقع محتملة
  const possibleScripts = [
    'scripts/post-image.mjs',
    path.join(process.env.HOME || '', '.claude/skills/square-post/scripts/post-image.mjs'),
    path.join(process.env.HOME || '', '.skills/square-post/scripts/post-image.mjs'),
    path.join(process.env.HOME || '', 'skills/square-post/scripts/post-image.mjs'),
  ];

  let scriptPath = null;
  for (const p of possibleScripts) {
    if (fs.existsSync(p)) {
      scriptPath = p;
      break;
    }
  }

  if (!scriptPath) {
    return { 
      success: false, 
      error: 'لم يتم العثور على post-image.mjs. تأكد من تثبيت مهارة square-post.',
      searched: possibleScripts
    };
  }

  try {
    const cmd = `BINANCE_SQUARE_OPENAPI_KEY="${apiKey}" node "${scriptPath}" --text "${safeText}" --images "${absImagePath}"`;
    
    const output = execSync(cmd, { 
      encoding: 'utf-8',
      timeout: 120000,
      cwd: process.cwd()
    });

    console.log(output);
    return { success: true, output };
  } catch (error) {
    return { 
      success: false, 
      error: error.message.slice(0, 300),
      stdout: error.stdout?.toString().slice(0, 300),
      stderr: error.stderr?.toString().slice(0, 300)
    };
  }
}

module.exports = { postWithImage };
