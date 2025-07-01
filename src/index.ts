// src/server.ts
import express, { Request, Response } from "express";
import puppeteer from "puppeteer";
import { handleHanimeRed } from "./sites/hanimeRed";
import { handleGeneric } from "./sites/generic";
import cors from "cors";

const app = express();
const port = 3000;

app.use(cors());
app.get("/test", (_req: Request, res: Response) => {
  res.send("ok");
});

app.get("/api/video", (async (req: Request, res: Response) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).json({ error: "Missing url parameter" });
  }

  console.log(`🌐 正在抓取页面: ${targetUrl}`);

  const isProduction = process.env.NODE_ENV === "production";
  console.log(`🚀 当前环境: ${isProduction ? "生产环境" : "本地环境"}`);

  const browser = await puppeteer.launch({
    headless: isProduction, // 生产环境 true，本地 false
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      ...(isProduction ? [] : ["--proxy-server=http://127.0.0.1:10808"]),
    ],
  });
  const page = await browser.newPage();

  await page.setCacheEnabled(false);
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/114.0 Safari/537.36"
  );
  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-US,en;q=0.9",
  });

  const capturedVideoUrls: string[] = [];

  page.on("console", (msg) => {
    console.log("🧭 浏览器内日志:", msg.text());
  });

  page.on("requestfinished", async (request) => {
    const url = request.url();
    const response = await request.response();
    const headers = response?.headers() || {};

    if (
      url.includes(".mp4") ||
      url.includes(".m3u8") ||
      headers["content-type"]?.includes("application/vnd.apple.mpegurl")
    ) {
      if (!capturedVideoUrls.includes(url)) {
        console.log("🎯 捕获到视频资源:", url);
        capturedVideoUrls.push(url);
      }
    }
  });

  try {
    await page.goto(targetUrl, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((resolve) => setTimeout(resolve, 5000));
    if (targetUrl.includes("hanime.red")) {
      await handleHanimeRed(page, capturedVideoUrls);
    } else {
      await handleGeneric(page, capturedVideoUrls);
    }
  } catch (error) {
    console.error("❌ 页面加载失败:", error);
  }

  await browser.close();
  res.json({ videos: capturedVideoUrls });
}) as express.RequestHandler);

app.listen(port, () => {
  console.log(`✅ 服务已启动：http://localhost:${port}`);
});
