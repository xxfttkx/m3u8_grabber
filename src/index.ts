import express, { Request, Response } from "express";
import puppeteer from "puppeteer";

const app = express();
const port = 3000;

app.get("/test", (req: Request, res: Response) => {
  res.send("ok");
});

app.get("/api/m3u8", (async (req: Request, res: Response) => {
  const pageUrl = req.query.url as string;

  if (!pageUrl) {
    return res.status(400).json({ error: "Missing url parameter" });
  }

  console.log(`🌐 正在抓取页面: ${pageUrl}`);

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const m3u8List: string[] = [];

  // 监听所有网络请求
  page.on("requestfinished", async (request) => {
    const url = request.url();
    const response = await request.response();
    const headers = response?.headers() || {};

    if (
      url.includes(".m3u8") ||
      headers["content-type"]?.includes("application/vnd.apple.mpegurl")
    ) {
      if (!m3u8List.includes(url)) {
        console.log("🎯 捕获到 m3u8:", url);
        m3u8List.push(url);
      }
    }
  });

  try {
    await page.goto(pageUrl, { waitUntil: "networkidle2", timeout: 30000 });

    // 等待几秒加载可能的播放请求
    await new Promise((resolve) => setTimeout(resolve, 5000));
  } catch (err) {
    console.error("❌ 页面加载失败:", err);
  }

  await browser.close();

  res.json({ m3u8: m3u8List });
}) as express.RequestHandler);

app.listen(port, () => {
  console.log(`✅ 服务已启动：http://localhost:${port}`);
});
