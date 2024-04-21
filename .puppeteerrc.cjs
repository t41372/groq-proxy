const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes the cache location for Puppeteer.
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
  // 选择要使用的浏览器的位置，预设会下载一个保证可用的浏览器到当前目录下的.cache目录
  // executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',

  headless: false, // true是旧无头模式, false是有gui模式(好像有点问题), new 是新版无头模式
  args: [
    // "--user-data-dir=./chromeTemp", // 保存浏览器缓存
    // 下面选项，如果被网页反爬虫机制发现, 可以试试
    // '--no-sandbox',
    // '--disable-setuid-sandbox',
    // '--disable-blink-features=AutomationControlled',
  ],
  // 是否将浏览器的输出信息打印到终端, debug 时推荐开启, 其它时候建议关闭, 很吵
  dumpio: true,
};