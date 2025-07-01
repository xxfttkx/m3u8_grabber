import { Page } from "puppeteer";

export async function handleJableTv(page: Page, capturedVideoUrls: string[]) {
  console.log("📺 正在处理 jable.tv 页面...");

  try {
    const hlsUrl = await page.evaluate(() => {
      // @ts-ignore
      return typeof window.hlsUrlh === "string" ? window.hlsUrlh : null;
    });

    if (hlsUrl && hlsUrl.endsWith(".m3u8")) {
      if (!capturedVideoUrls.includes(hlsUrl)) {
        console.log("🎯 从 window.hlsUrlh 捕获 m3u8:", hlsUrl);
        capturedVideoUrls.push(hlsUrl);
      }
    } else {
      console.log("⚠️ 页面中未找到 window.hlsUrlh 或格式不正确");
    }
  } catch (err) {
    console.error("❌ 处理 jable.tv 出错:", err);
  }
}
