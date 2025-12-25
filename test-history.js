const { chromium } = require('playwright');

async function testAllTools() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const tools = [
    { name: 'JWT', url: 'http://localhost:3000/jwt', action: async (p) => {
      // Decode a JWT
      await p.fill('textarea[placeholder*="JWT Token"]', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
      await p.click('button:has-text("解码")');
      await p.waitForTimeout(500);
    }},
    { name: 'JSON', url: 'http://localhost:3000/json', action: async (p) => {
      // Format JSON
      await p.fill('textarea[placeholder*="JSON"]', '{"name":"test","value":123}');
      await p.click('button:has-text("FORMAT")');
      await p.waitForTimeout(500);
    }},
    { name: 'Image', url: 'http://localhost:3000/image', action: async (p) => {
      // Convert key to URL
      await p.click('button:has-text("Key→URLs")');
      await p.fill('textarea[placeholder*="Key"]', 'test/image/pic.jpg');
      await p.click('button:has-text("CONVERT")');
      await p.waitForTimeout(500);
    }},
    { name: 'Timestamp', url: 'http://localhost:3000/timestamp', action: async (p) => {
      // Convert timestamp
      await p.fill('input[placeholder*="时间戳"]', '1704067200');
      await p.click('button:has-text("转换为日期")');
      await p.waitForTimeout(500);
    }},
    { name: 'AISQL', url: 'http://localhost:3000/aisql', action: async (p) => {
      // Note: This requires backend connection, just verify UI
      // Check if history button exists
      await p.waitForSelector('button:has-text("历史记录")', { timeout: 5000 }).catch(() => {});
    }},
    { name: 'JSONFix', url: 'http://localhost:3000/jsonfix', action: async (p) => {
      // Fix JSON
      await p.fill('textarea[placeholder*="JSON"]', '{name:"test"}');
      await p.click('button:has-text("FIX")');
      await p.waitForTimeout(500);
    }},
    { name: 'Diff', url: 'http://localhost:3000/diff', action: async (p) => {
      // Compare JSON
      await p.fill('textarea[placeholder*="原始 JSON"]', '{"a":1}');
      await p.fill('textarea[placeholder*="新的 JSON"]', '{"a":2}');
      await p.click('button:has-text("对比 JSON")');
      await p.waitForTimeout(500);
    }},
    { name: 'Translate', url: 'http://localhost:3000/translate', action: async (p) => {
      // Translate text
      await p.fill('textarea[placeholder*="翻译"]', 'Hello world');
      await p.click('button:has-text("翻译")');
      await p.waitForTimeout(1000);
    }}
  ];

  console.log('Starting history functionality tests...\n');

  for (const tool of tools) {
    console.log(`\n=== Testing ${tool.name} Tool ===`);
    try {
      await page.goto(tool.url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1000);

      // Check if history button exists
      const historyBtn = await page.$('button:has-text("历史记录")');
      const loadFromCloudBtn = await page.$('button:has-text("从云端加载")');

      console.log(`  - History button: ${historyBtn ? '✓ Found' : '✗ Missing'}`);
      console.log(`  - Cloud load button: ${loadFromCloudBtn ? '✓ Found' : '✗ Missing'}`);

      // Perform action to generate history
      await tool.action(page);

      // Click history button
      if (historyBtn) {
        await historyBtn.click();
        await page.waitForTimeout(500);

        // Check if history panel is visible
        const historyPanel = await page.$('.history-panel.active, .history-panel:not([style*="display: none"])');
        console.log(`  - History panel: ${historyPanel ? '✓ Opens' : '✗ Does not open'}`);
      }

      console.log(`  ✓ ${tool.name} test completed`);
    } catch (error) {
      console.log(`  ✗ ${tool.name} test failed: ${error.message}`);
    }
  }

  await browser.close();
  console.log('\n=== All tests completed ===');
}

testAllTools().catch(console.error);
