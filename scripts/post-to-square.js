// scripts/post-to-square.js
// ينشر منشوراً مع صورة على Binance Square

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// المسار الفعلي للمهارة المستنسخة في GitHub Actions
const SKILL_SCRIPT = '/tmp/binance-skills/skills/binance/square-post/scripts/post-image.mjs';

function postWithImage(text, imagePath) {
  if (!fs.existsSync(imagePath)) {
    return { success: false, error: `الصورة غير موجودة: ${imagePath}` };
  }

  const apiKey = process.env.BINANCE_SQUARE_OPENAPI_KEY;
  if (!apiKey) {
    return { success: false, error: 'BINANCE_SQUARE_OPENAPI_KEY غير موجود' };
  }

  if (!fs.existsSync(SKILL_SCRIPT)) {
    return {
      success: false,
      error: `الملف غير موجود: ${SKILL_SCRIPT}`,
      hint: 'تحقق من خطوة Clone square-post skill في الـ workflow'
    };
  }

  // استبدل علامات الاقتباس
  const safeText = text.replace(/"/g, '\\"');
  const absImagePath = path.resolve(imagePath);
  const skillDir = path.dirname(path.dirname(SKILL_SCRIPT));

  try {
    const cmd = `BINANCE_SQUARE_OPENAPI_KEY="${apiKey}" node "${SKILL_SCRIPT}" --text "${safeText}" --images "${absImagePath}"`;

    console.log(`▶️  تشغيل post-image.mjs`);
    console.log(`📁 مجلد المهارة: ${skillDir}`);
    console.log(`🖼️  الصورة: ${absImagePath}`);

    const output = execSync(cmd, {
      encoding: 'utf-8',
      timeout: 120000,
      cwd: skillDir,
      env: { ...process.env, BINANCE_SQUARE_OPENAPI_KEY: apiKey }
    });

    console.log(output);
    return { success: true, output };
  } catch (error) {
    return {
      success: false,
      error: error.message.slice(0, 300),
      stdout: error.stdout?.toString().slice(0, 500),
      stderr: error.stderr?.toString().slice(0, 500)
    };
  }
}

export { postWithImage };
