# K桌遊

桌遊小幫手：教你怎麼玩，並幫主持人念旁白。按一下就播出「天黑請閉眼……」，不用有人當主持而不能玩。

**中文、English、日本語**三語：介面、玩法、旁白語音與字幕都跟著右上角的語言切換。

網頁版：<https://agan0617.github.io/KBoardGame/>（純 HTML＋JS，沒有相依套件；打開過一次就能離線用）
Android App：[KBoardGameApp](https://github.com/agan0617/KBoardGameApp)（WebView 外殼，APK 在 Releases）

## 功能

- **玩法**：每款遊戲的規則、人數配置、角色說明，上方有目錄可以跳
- **主持**：勾選這局用到的角色，旁白會自動換成對應的句子
  - **連續播放**：照順序念完一句、停頓幾秒（讓玩家睜眼、閉眼）再念下一句；停頓可選短／中／長
  - 點清單裡任一句，就只念那一句；⏮ ⏭ 一句一句手動念
  - 念的那句同時顯示成**字幕**，釘在畫面上方，捲動清單也看得到
  - 旁白是預先用 Azure 神經語音錄好的 mp3（中文 YunJhe、英文 Ryan、日文 Keita），打開主持頁就先全部載入，念的時候不用等網路

## 目前收錄

| 遊戲 | 人數 | 旁白 |
|---|---|---|
| 阿瓦隆 | 5–10 人 | 夜晚（依派西維爾、莫甘娜、莫德雷德、奧伯倫自動調整）、口令（投票、任務卡）、刺殺 |

## 新增一款遊戲

1. 開 `games/<遊戲 id>/game.json`（格式見下），把 id 加進 `games/index.json` 的 `games`
2. 產生旁白音檔：`python tools/make_audio.py --key-file <Azure 語音金鑰檔>`（只念新句子和改過字的句子）
3. commit＋push，網頁版與 App 下次打開就有了，不用重新打包 APK

### game.json

```jsonc
{
  "id": "avalon",                 // 跟資料夾同名
  "name": { "zh": "阿瓦隆", "en": "Avalon", "ja": "アヴァロン" },  // 要翻譯的欄位都寫成 { zh, en, ja }
  "players": { "zh": "5–10 人", "en": "5–10 players", "ja": "5〜10人" },
  "time": { "zh": "30 分鐘", "en": "30 min", "ja": "30分" },
  "summary": { "zh": "首頁卡片上的一句話介紹", "en": "…", "ja": "…" },
  "voice": { "zh": "zh-TW-YunJheNeural", "en": "en-GB-RyanNeural", "ja": "ja-JP-KeitaNeural" },  // 可省略，句子也可以自己帶
  "rate": { "zh": "-8%", "en": "-5%", "ja": "-5%" },  // 語速（可省略）

  "rules": [                      // 玩法頁：一節一個
    { "title": { "zh": "遊戲概要", "en": "Overview", "ja": "ゲームの概要" },
      "md": { "zh": ["一行一個字串", "", "- 條列", "### 小標", "| 表 | 格 |", "|---|---|", "| a | b |"], "en": [], "ja": [] } }
  ],

  "host": {
    "options": [                  // 主持頁上方的勾選（這局有沒有用到某個角色或規則）
      { "id": "percival", "label": { "zh": "派西維爾", "en": "Percival", "ja": "パーシヴァル" }, "default": true }
    ],
    "scripts": [                  // 一組旁白一個分頁
      {
        "id": "night", "title": { "zh": "夜晚", "en": "Night", "ja": "夜" },
        "autoplay": false,        // 可省略；false＝不顯示連續播放，只能一句一句點（口令類）
        "lines": [
          { "id": "night02", "pause": 3, "text": { "zh": "天黑請閉眼。", "en": "Night falls.", "ja": "夜になりました。" } },
          { "id": "night08a", "pause": 2, "when": "percival && morgana", "text": { "zh": "梅林和莫甘娜請豎起大拇指。", "en": "…", "ja": "…" } }
        ]
      }
    ]
  }
}
```

- `md` 支援：段落、`- ` 條列、`### ` 小標、`| |` 表格、`**粗體**`
- `pause`：連續播放時，這句念完停幾秒再念下一句（乘上短 0.6／中 1／長 1.6）
- `when`：勾選條件，選項 id 用 `&&` 串、`!` 表示沒勾；不寫就是每次都念
- 缺哪一語就退回中文顯示；旁白缺那一語的音檔時，改用裝置內建語音念
- 句子 `id` 就是音檔名（`audio/<語言>/<id>.mp3`），整款遊戲裡不能重複；改字不用改 id，`make_audio.py` 會比對文字重念

## 檔案

- `index.html`、`style.css`、`js/app.js`：網頁本體；改了要把 `sw.js` 的 `VERSION` 加一
- `games/`：遊戲資料與旁白音檔（`audio/<語言>/_tts.json` 記每句念的是哪個版本）
- `tools/make_audio.py`：產生旁白音檔（Azure 語音 eastasia；金鑰不進 repo）
- `tools/make_icons.py`：產生圖示（需要 Pillow）
