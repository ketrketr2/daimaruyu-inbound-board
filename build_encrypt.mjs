#!/usr/bin/env node
// DAIMARUYU INBOUND BOARD — 暗号化ビルド
// 使い方:  node build_encrypt.mjs <ID> <PASSWORD> [--inline-chartjs <path/to/chart.umd.js>]
//   平文 body.html を読み、AES-256-GCM で暗号化した index.html を生成する。
//   鍵導出: PBKDF2-HMAC-SHA256 310,000回 / salt 16byte（毎ビルド乱数）/ パスフレーズ = "ID:PASSWORD"
import { readFileSync, writeFileSync } from 'node:fs';
import { randomBytes, pbkdf2Sync, createCipheriv } from 'node:crypto';
import { gzipSync } from 'node:zlib';

const [id, pw] = process.argv.slice(2);
if (!id || !pw) { console.error('usage: node build_encrypt.mjs <ID> <PASSWORD> [--inline-chartjs path]'); process.exit(1); }
const inlineIdx = process.argv.indexOf('--inline-chartjs');
const chartTag = inlineIdx > -1
  ? `<script>${readFileSync(process.argv[inlineIdx + 1], 'utf8')}</script>`
  : `<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.js"></script>`;

const body = readFileSync(new URL('./body.html', import.meta.url), 'utf8');
const fullDoc = `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex,nofollow">
<title>DAIMARUYU INBOUND BOARD</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=BIZ+UDGothic:wght@400;700&display=swap" rel="stylesheet">
${chartTag}
</head><body>
${body}
</body></html>`;

const salt = randomBytes(16);
const iv = randomBytes(12);
const key = pbkdf2Sync(`${id}:${pw}`, salt, 310000, 32, 'sha256');
const cipher = createCipheriv('aes-256-gcm', key, iv);
const ct = Buffer.concat([cipher.update(gzipSync(fullDoc, { level: 9 })), cipher.final(), cipher.getAuthTag()]);

const B = (b) => b.toString('base64');
const shell = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex,nofollow">
<title>DAIMARUYU INBOUND BOARD — 認証</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=BIZ+UDGothic:wght@400;700&display=swap" rel="stylesheet">
<style>
:root{--bg:#0F1B2E;--panel:#16263D;--line:#22334E;--tx:#E8EEF7;--sub:#A9B7CC;--cy:#00C2FF;--bad:#FF5C7A}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--tx);font-family:'BIZ UDGothic',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;
background-image:linear-gradient(rgba(0,194,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(0,194,255,.05) 1px,transparent 1px);background-size:42px 42px}
.card{width:min(420px,92vw);background:linear-gradient(180deg,#182A44,#121F35);border:1px solid var(--line);border-radius:16px;padding:36px 34px 30px;box-shadow:0 24px 70px rgba(0,0,0,.5)}
.logo{display:flex;align-items:center;gap:12px;margin-bottom:6px}
.logo .m{width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#00C2FF,#7C5CFF);color:#04101F;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:17px}
.logo b{font-size:16px;letter-spacing:.07em}
.sub{color:var(--sub);font-size:11px;letter-spacing:.14em;margin-bottom:24px}
label{display:block;font-size:11px;color:var(--sub);letter-spacing:.12em;margin:13px 0 6px}
input{width:100%;background:#0B1526;border:1px solid var(--line);border-radius:9px;color:var(--tx);font-family:inherit;font-size:14px;padding:11px 13px;outline:none;transition:border .15s}
input:focus{border-color:var(--cy)}
button{width:100%;margin-top:20px;background:linear-gradient(90deg,#0091CC,#00C2FF);border:none;border-radius:9px;color:#04101F;font-family:inherit;font-weight:700;font-size:14px;letter-spacing:.2em;padding:12px;cursor:pointer}
button:hover{filter:brightness(1.12)}
button:disabled{opacity:.55;cursor:wait}
.err{color:var(--bad);font-size:12px;margin-top:12px;min-height:16px;text-align:center}
.note{color:var(--sub);font-size:10.5px;margin-top:16px;text-align:center;line-height:1.7;letter-spacing:.05em}
.shake{animation:shk .4s}
@keyframes shk{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-7px)}40%,80%{transform:translateX(7px)}}
</style>
</head>
<body>
<div class="card" id="card">
  <div class="logo"><div class="m">大</div><b>DAIMARUYU INBOUND BOARD</b></div>
  <div class="sub">— 認証 —</div>
  <form id="f">
    <label>ID</label><input id="u" autocomplete="username" autocapitalize="none" autofocus>
    <label>PASSWORD</label><input id="p" type="password" autocomplete="current-password">
    <button id="b" type="submit">UNLOCK</button>
  </form>
  <div class="err" id="e"></div>
  <div class="note">RESTRICTED · AES-256 ENCRYPTED<br>本ボードは暗号化されています。正しい ID / PASSWORD なしにはデータを復号できません。</div>
</div>
<script>
const SALT=Uint8Array.from(atob('${B(salt)}'),c=>c.charCodeAt(0));
const IV=Uint8Array.from(atob('${B(iv)}'),c=>c.charCodeAt(0));
const CT=Uint8Array.from(atob('${B(ct)}'),c=>c.charCodeAt(0));
async function unlock(uid,pw){
  const km=await crypto.subtle.importKey('raw',new TextEncoder().encode(uid+':'+pw),'PBKDF2',false,['deriveKey']);
  const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:SALT,iterations:310000,hash:'SHA-256'},km,{name:'AES-GCM',length:256},false,['decrypt']);
  const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:IV},key,CT);   // 失敗なら throw
  const html=await new Response(new Response(pt).body.pipeThrough(new DecompressionStream('gzip'))).text();
  document.open();document.write(html);document.close();
}
document.getElementById('f').addEventListener('submit',async ev=>{
  ev.preventDefault();
  const b=document.getElementById('b'),e=document.getElementById('e'),card=document.getElementById('card');
  b.disabled=true;b.textContent='DECRYPTING…';e.textContent='';
  try{ await unlock(document.getElementById('u').value.trim(),document.getElementById('p').value); }
  catch(err){
    b.disabled=false;b.textContent='UNLOCK';
    e.textContent='IDまたはPASSWORDが違います';
    card.classList.remove('shake');void card.offsetWidth;card.classList.add('shake');
  }
});
</script>
</body>
</html>`;

writeFileSync(new URL('./index.html', import.meta.url), shell);
console.log(`index.html generated: ${(shell.length / 1024).toFixed(0)} KB (payload ${(ct.length / 1024).toFixed(0)} KB encrypted, id=${id})`);
