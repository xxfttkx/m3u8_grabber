import { Page } from "puppeteer";

export async function handleHanimeRed(page: Page, capturedVideoUrls: string[]) {
  const frames = page.frames();
  const nhplayerFrame = frames.find((f) => f.url().includes("nhplayer.com"));

  if (!nhplayerFrame) {
    console.log("❌ 没找到对应的 nhplayer.com iframe");
    return;
  }

  console.log("🔍 找到 nhplayer.com 的 iframe，尝试点击播放按钮");
  await nhplayerFrame.evaluate(() => {
    const playBtn = document.querySelector(".play.p-pulse");
    if (playBtn instanceof HTMLElement) {
      console.log("👆 找到播放按钮，尝试点击");
      playBtn.click();
    } else {
      console.log("❌ 没有找到播放按钮");
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 5000));

  const nestedFrame = nhplayerFrame
    .childFrames()
    .find((f) => f.url().includes("player.php"));

  if (nestedFrame) {
    console.log("🎯 找到嵌套 iframe:", nestedFrame.url());
    const mp4Urls = await nestedFrame.evaluate(() => {
      const urls: string[] = [];
      const videos = document.querySelectorAll("video");
      videos.forEach((video) => {
        if (video.src) urls.push(video.src);
        const sources = video.querySelectorAll("source");
        sources.forEach((s) => {
          if (s.src) urls.push(s.src);
        });
      });
      return urls;
    });

    for (const url of mp4Urls) {
      if (url.endsWith(".mp4") && !capturedVideoUrls.includes(url)) {
        console.log("🎯 从 iframe 的 video 元素中捕获 mp4:", url);
        capturedVideoUrls.push(url);
      }
    }
  }
}
