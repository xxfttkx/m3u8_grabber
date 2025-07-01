import { Page } from "puppeteer";

export async function handleGeneric(page: Page, capturedVideoUrls: string[]) {
  await page.evaluate(() => {
    const video = document.querySelector("video");
    if (video) {
      video.play().catch((err) => console.warn("🔈 自动播放失败:", err));
    }

    const playBtn = document.querySelector(".play, button, .btn-play");
    if (playBtn instanceof HTMLElement) {
      console.log("👆 找到播放按钮，尝试点击");
      playBtn.click();
    } else {
      console.log("❌ 没有找到播放按钮");
    }
  });
}
