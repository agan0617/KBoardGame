"""把每款遊戲 game.json 裡的旁白句子用 Azure 神經語音念成 mp3，放在 games/<id>/audio/<句子 id>.mp3。

    python tools/make_audio.py --key-file <Azure 語音金鑰檔>              # 只補新句子、改過字的句子
    python tools/make_audio.py --key-file <金鑰檔> --game avalon --force  # 整款重念

- 語音與語速看 game.json 的 voice、rate（沒寫就用 zh-TW-YunJheNeural、0%）；句子也可以自己帶 voice
- 念過的句子記在 audio/_tts.json（文字＋語音＋語速的雜湊），沒變就跳過，不重複花額度
- 刪掉的句子，音檔也會一起刪
- 金鑰不進 repo；Azure 資源在 eastasia（F0 免費額度，用完回 429 不收費）
"""
import argparse, hashlib, json, os, sys, time, urllib.error, urllib.request
from xml.sax.saxutils import escape

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
REGION = 'eastasia'


def tts(key, text, voice, rate):
    lang = '-'.join(voice.split('-')[:2])
    ssml = (f"<speak version='1.0' xml:lang='{lang}'><voice name='{voice}'>"
            f"<prosody rate='{rate}'>{escape(text)}</prosody></voice></speak>")
    req = urllib.request.Request(
        f'https://{REGION}.tts.speech.microsoft.com/cognitiveservices/v1', data=ssml.encode('utf-8'),
        headers={'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/ssml+xml',
                 'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3', 'User-Agent': 'KBoardGame-tools'})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.read()
    except urllib.error.HTTPError as e:
        if e.code == 429:
            sys.exit('Azure 回 429：本月免費額度用完或請求太密，晚點再跑')
        sys.exit(f'Azure TTS 失敗：HTTP {e.code} {e.read()[:300]!r}')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--key-file', required=True)
    ap.add_argument('--game', help='只處理這款（遊戲 id）')
    ap.add_argument('--force', action='store_true', help='不管有沒有變，全部重念')
    a = ap.parse_args()
    with open(a.key_file, encoding='utf-8-sig') as f:
        key = f.read().strip()

    with open(os.path.join(ROOT, 'games', 'index.json'), encoding='utf-8') as f:
        ids = json.load(f)['games']
    made = 0
    for gid in ids:
        if a.game and gid != a.game:
            continue
        gdir = os.path.join(ROOT, 'games', gid)
        with open(os.path.join(gdir, 'game.json'), encoding='utf-8') as f:
            g = json.load(f)
        adir = os.path.join(gdir, 'audio')
        os.makedirs(adir, exist_ok=True)
        mpath = os.path.join(adir, '_tts.json')
        done = {}
        if os.path.exists(mpath):
            with open(mpath, encoding='utf-8') as f:
                done = json.load(f)
        want = {}
        for s in g.get('host', {}).get('scripts', []):
            for l in s['lines']:
                voice = l.get('voice', g.get('voice', 'zh-TW-YunJheNeural'))
                rate = l.get('rate', g.get('rate', '0%'))
                h = hashlib.sha1(f"{l['text']}|{voice}|{rate}".encode('utf-8')).hexdigest()[:12]
                want[l['id']] = h
                out = os.path.join(adir, l['id'] + '.mp3')
                if not a.force and done.get(l['id']) == h and os.path.exists(out):
                    continue
                with open(out, 'wb') as f:
                    f.write(tts(key, l['text'], voice, rate))
                made += 1
                print(f"{gid}/{l['id']}  {l['text']}")
                time.sleep(0.3)
        for old in set(done) - set(want):
            p = os.path.join(adir, old + '.mp3')
            if os.path.exists(p):
                os.remove(p)
                print(f'刪除 {gid}/{old}.mp3')
        with open(mpath, 'w', encoding='utf-8') as f:
            json.dump(want, f, ensure_ascii=False, indent=1, sort_keys=True)
    print(f'完成，新念 {made} 句')


if __name__ == '__main__':
    main()
