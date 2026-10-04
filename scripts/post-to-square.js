// scripts/post-to-square.js
// ينشر منشوراً مع صورة على Binance Square
// يستخدم مهارة square-post الرسمية عبر استدعاء shell

const { execSync } = require('child_process');
const fs = require('fs');

function postWithImage(text, imagePath) {
  if (!fs.existsSync(imagePath)) {
    return { success: false, error: `الصورة غير موجودة: ${imagePath}` };
  }

  const apiKey = process.env.BINANCE_SQUARE_OPENAPI_KEY;
  if (!apiKey) {
    return { success: false, error: 'BINANCE_SQUARE_OPENAPI_KEY غير موجود' };
  }

  // استبدل علامات الاقتباس في النص لتجنب مشاكل shell
  const safeText = text.replace(/"/g, '\\"').replace(/\n/g, '\\n');

  try {
    const cmd = `BINANCE_SQUARE_OPENAPI_KEY="${apiKey}" node scripts/post-image.mjs --text "${safeText}" --images "${imagePath}"`;
    
    const output = execSync(cmd, { 
      encoding: 'utf-8',
      timeout: 120000,
      cwd: process.env.GITHUB_WORKSPACE || '.'
    });

    console.log(output);
    return { success: true, output };
  } catch (error) {
    return { 
      success: false, 
      error: error.message.slice(0, 200),
      stdout: error.stdout?.toString().slice(0, 200)
    };
  }
}

module.exports = { postWithImage };
