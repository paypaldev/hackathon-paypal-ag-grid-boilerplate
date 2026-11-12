---
name: lemo-opuscar
description: "Direct and produce a short film, motion graphics piece, or animation made entirely in code using the Lemo-Opuscar library (66+ styles including Impasto Oil Painting, Watercolor Brush, Ukiyo-e, Satellite Briefing, Exploded Teardown, Swiss Motion Graphics, etc.). Triggers on: make a film, create animation, generate video in code, directed explainer, produce short film, opuscar, film style."
user-invocable: true
---

# Lemo-Opuscar: Film Studio in Code

Direct and produce complete animated short films, explainers, and motion graphics rendered purely in code (HTML5 Canvas, WebGL, SVG, Web Audio, Kokoro TTS, FFmpeg).

Library root: `d:\code\lemo-opuscar`

---

## 1. Quick Start & Prerequisites

1. **Verify or set up the library:**
   On Windows PowerShell:
   ```powershell
   & "d:\code\lemo-opuscar\scripts\setup.ps1"
   ```
   Or install core dependencies (Playwright headless shell, Node modules, Python packages):
   ```powershell
   & "d:\code\lemo-opuscar\scripts\setup.ps1" deps
   ```
2. **Read the guides:**
   - Architecture & Rules: `d:\code\lemo-opuscar\AGENTS.md`
   - Director's Handbook: `d:\code\lemo-opuscar\DIRECTOR.md`
   - Technical Pipeline: `d:\code\lemo-opuscar\TECHNIQUE.md`
   - Available Styles: `d:\code\lemo-opuscar\styles\README.md`
   - Custom Styles: `d:\code\lemo-opuscar\MY-STYLES.md`

---

## 2. All 66 Film Styles by Category

- **剪辑与纪实 Edit & Documentary (8):**
  - 字幕新闻 Caption News (`caption-news`)
  - 1920s 新闻影片 1920s Newsreel (`newsreel-1920s`)
  - 实时倒计时分屏 Live Countdown Split-screen (`live-countdown`)
  - 延时交响 Time-lapse Symphony (`timelapse-symphony`)
  - 视觉调查 Visual Investigation (`visual-investigation`)
  - 构成主义蒙太奇 Constructivist Montage (`constructivist-montage`)
  - 体育战术板 Sports Telestrator (`sports-telestrator`)
  - 电视新闻包装 Broadcast News Package (`broadcast-news`)

- **实证影像 Evidence Films (8):**
  - 卫星简报 Satellite Briefing (`satellite-briefing`)
  - 工程简报板 Engineering Briefing Board (`engineering-briefing`)
  - 点云测绘 LiDAR Survey (`lidar-survey`)
  - 白模投影 Projection on White Model (`white-model-projection`)
  - 数据实物化 Data Physicalization (`data-physicalization`)
  - 产品拆解 Exploded Teardown (`exploded-teardown`)
  - 显微叙事 Microscope Story (`microscope-story`)
  - 档案灯台 Archive Light Table (`archive-light-table`)

- **手绘与绘画 Hand-drawn & Painting (8):**
  - 蜡笔儿童绘本 Crayon Picture Book (`crayon-picture-book`)
  - 水彩笔刷 Watercolor Brush (`watercolor-brush`)
  - 中国水墨 Chinese Ink Wash (`chinese-ink`)
  - 油画厚涂 Impasto Oil Painting (`impasto`)
  - 一笔画 One-line Drawing (`one-line-drawing`)
  - 白板讲解 Whiteboard Explainer (`whiteboard-explainer`)
  - 钢笔淡彩 Urban Sketch · Pen & Wash (`urban-sketch`)
  - 黑板粉笔 Chalkboard (`chalkboard`)

- **东方传统 East Asian Traditions (4):**
  - 皮影戏 Shadow Puppetry (`shadow-puppetry`)
  - 浮世绘 Ukiyo-e (`ukiyo-e`)
  - 红色窗花剪纸 Red Paper-cut (`red-papercut`)
  - 纸雕灯影 Paper-cut Lightbox (`papercut-lightbox`)

- **印刷与版画 Print & Printmaking (6):**
  - Risograph 孔版印刷 Risograph Print (`risograph`)
  - 复古半调案卷 Halftone Dossier (`halftone-dossier`)
  - 木刻版画 Woodcut Print (`woodcut`)
  - 铜版画 Copperplate Engraving (`copperplate`)
  - 丝印旅行海报 Silkscreen Travel Poster (`silkscreen-travel-poster`)
  - 印刷长镜头 Printed Long Take (`printed-long-take`)

- **图形与排版 Graphic & Type (7):**
  - 瑞士动态排版 Swiss Motion Graphics (`swiss-motion`)
  - 60s 间谍片头 60s Spy Title Sequence (`spy-titles-1960s`)
  - 装饰艺术 Art Deco (`art-deco`)
  - 蓝图 / 工程制图 Blueprint (`blueprint`)
  - 彩色玻璃窗 Stained Glass (`stained-glass`)
  - 象形运动图形 Pictogram Motion (`pictogram-motion`)
  - ASCII / CRT 终端 ASCII / CRT Terminal (`ascii-crt`)

- **信息与发布 Information & Keynote (8):**
  - 数据叙事 Data Storytelling (`data-storytelling`)
  - 等距信息图 Isometric Infographic (`isometric-infographic`)
  - 暗色科技发布 Dark Tech Keynote (`dark-tech-keynote`)
  - 活体实机录屏 Living Screencast (`living-screencast`)
  - 科幻全息界面 Sci-fi Hologram HUD (`scifi-hologram`)
  - 地铁线路图 Transit Map (`transit-map`)
  - 等距绘本 Isometric Picture Book (`isometric-picture-book`)
  - 电路板 Circuit Board (`circuit-board`)

- **卡通与动画 Cartoon & Anime (4):**
  - 1930s 橡皮管卡通 1930s Rubber Hose Cartoon (`rubber-hose-1930s`)
  - 80 年代赛璐璐动画 80s Cel Anime (`cel-anime-1980s`)
  - 科幻情景喜剧卡通 Sci-Fi Sitcom Toon (`scifi-sitcom-toon`)
  - 50s 扁平卡通 Mid-century Cartoon (`midcentury-cartoon-1950s`)

- **游戏 Games (4):**
  - 16-bit 像素 RPG 16-bit Pixel RPG (`pixel-rpg-16bit`)
  - HD-2D (`hd-2d`)
  - 微游戏快闪 Microgame Frenzy (`microgame-frenzy`)
  - 综艺节奏扁平 Game Show Flat (`game-show-flat`)

- **电影与时代 Cinema & Eras (2):**
  - 1920s 默片 1920s Silent Film (`silent-film-1920s`)
  - 后室 / 新怪谈 Liminal Found Footage (`liminal-found-footage`)

- **材质与 3D Materials & 3D (7):**
  - 积木玩具 Brick Toy (`brick-toy`)
  - 纸片立体书 Paper Pop-up Book (`paper-popup-book`)
  - 移轴微缩 Tilt-Shift Miniature (`tilt-shift-miniature`)
  - 低多边形等距 Low-poly Isometric Island (`low-poly-isometric`)
  - 玻璃质感产品 Glass Product Render (`glass-product`)
  - 孟菲斯微缩景观 Memphis Diorama (`memphis-diorama`)
  - 桌面穿梭 Desktop Flythrough (`desktop-flythrough`)

---

## 3. Production Workflow (The 6-Step Pipeline)

1. **Brief:** Confirm style, topic, aspect ratio (16:9, 9:16), target duration (typically 30s-120s), and user-provided assets.
2. **Treatment (`TREATMENT.md`):** Draft 3 narrative structures, select the best candidate, and map scene-by-scene pacing.
3. **Look & Style Frames:** Render 2-3 keyframes using pure HTML5 Canvas / WebGL code. Verify colors and type against `STYLE.md`.
4. **Storyboard:** Optional visual beat breakdown if requested by user.
5. **Production:**
   - **Voice:** TTS generation using local Kokoro TTS engine or Edge-TTS (`core/tts/`).
   - **Score:** Algorithmic music or ambient synthesis.
   - **Animation Code:** Canvas2D / Three.js / WebGL deterministic timeline rendering.
   - **Mux & Mix:** Compile PNG frame sequence + audio tracks via FFmpeg (`core/render/still.mjs`, `tools/mix.py`).
6. **Delivery:** Export MP4 into project directory and present video playback path.
