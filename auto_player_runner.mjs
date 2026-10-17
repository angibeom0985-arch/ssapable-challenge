// 쌉파서블 2 강의 백그라운드 자동 재생기 (완강률 97% 이상 달성용)
// 강의용 크롬(프로필 ChromeProfiles/Ssapable, 포트 9665)의 전용 탭에서
// 소리 끄고(setVolume 0 + muted) 백그라운드로 재생하며, 강의가 끝나면 자동으로 다음 강의로 넘어가 재생한다.
import { chromium } from 'playwright-core';
import fs from 'fs';

const DIR = 'C:/tmp/ssap/auto';
const LESSONS = JSON.parse(fs.readFileSync('D:/인풋/01 바이브코딩/쌉파서블 2/00 정리/_lessons_enriched.json', 'utf8'));
const log = (...a) => fs.appendFileSync(`${DIR}/play.log`, `[${new Date().toLocaleString('ko-KR')}] ` + a.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join(' ') + '\n');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const status = { started: new Date().toISOString(), pid: process.pid, done: [], skipped: [], failed: [], current: null };
const save = () => fs.writeFileSync(`${DIR}/status.json`, JSON.stringify(status, null, 2));

const b = await chromium.connectOverCDP('http://127.0.0.1:9665', { timeout: 20000 });
const ctx = b.contexts()[0];
let p = ctx.pages()[0] || await ctx.newPage();

const vf = () => p.frames().find(f => f.url().includes('player.vimeo.com'));
const st = async () => {
  const f = vf();
  if (!f) return null;
  return f.evaluate(() => {
    const v = document.querySelector('video');
    return v ? { t: v.currentTime, d: v.duration, paused: v.paused, ended: v.ended, muted: v.muted, vol: v.volume, rs: v.readyState } : null;
  }).catch(() => null);
};
const cmd = (method, value) => p.evaluate(([m, v]) => {
  const f = document.querySelector('iframe[src*="vimeo"]');
  if (f && f.contentWindow) {
    // 중요: JSON.stringify를 쓰면 Vimeo가 구버전 Froogaloop 모드(playProgress/finish)로 전환되어
    // 사이트의 @vimeo/player(timeupdate/ended) 진도 저장 이벤트가 멈춤. 반드시 객체 그대로 전송!
    f.contentWindow.postMessage(v === undefined ? { method: m } : { method: m, value: v }, '*');
  }
}, [method, value]).catch(() => {});

const isDone = async () => /완료됨/.test(await p.evaluate(() => document.body.innerText.slice(0, 2500)).catch(() => ''));

const preDone = new Set(
  LESSONS.filter(l => (l.pageLines || []).some(line => line.includes('완료됨'))).map(l => l.num)
);
const queue = [
  ...LESSONS.filter(l => !preDone.has(l.num)),
  ...LESSONS.filter(l => preDone.has(l.num))
];

log('백그라운드 자동 재생 시작 — 전체', LESSONS.length, '강 (기존 완료', preDone.size, '강, 미완료', LESSONS.length - preDone.size, '강 우선 재생)');
save();

for (const L of queue) {
  if (fs.existsSync(`${DIR}/stop.flag`)) { log('stop.flag 감지 — 종료'); break; }
  const name = `${L.num}. ${L.title}`;
  try {
    if (preDone.has(L.num)) {
      status.skipped.push(L.num);
      save();
      continue;
    }
    if (!p.url().startsWith(L.href)) {
      await p.goto(L.href, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await sleep(5000);
    } else {
      await sleep(1500);
    }
    if (await isDone()) {
      log('이미 완료됨 건너뜀', name);
      status.skipped.push(L.num);
      save();
      continue;
    }
    status.current = { num: L.num, lessonId: L.lessonId, title: L.title, duration: L.duration, href: L.href, since: new Date().toISOString(), pos: '0초' };
    save();
    log('재생 시작 (음소거)', name, `(${L.duration})`);
    // Vimeo SDK는 객체 postMessage({ method: 'setMuted', value: true }) + play로 초기화
    await cmd('setMuted', true);
    await cmd('setVolume', 0);
    await cmd('play');
    await sleep(4000);

    let last = -1, stuck = 0;
    while (true) {
      if (fs.existsSync(`${DIR}/stop.flag`)) break;
      const s = await st();
      if (s) {
        if (s.d && !s.muted) {
          await cmd('setMuted', true);
          await cmd('setVolume', 0);
          await vf()?.evaluate(() => { const v = document.querySelector('video'); if (v) v.muted = true; }).catch(() => {});
        }
        status.current.pos = `${Math.round(s.t)}/${Math.round(s.d || 0)}초 (${s.d ? Math.round((s.t / s.d) * 100) : 0}%)`;
        status.current.updatedAt = new Date().toISOString();
        save();

        if (s.ended || (s.d && s.d > 0 && s.t >= s.d - 1.5) || (s.d && last >= s.d - 20 && (s.t < 30 || s.paused))) {
          log('영상 끝 도달', name, `${Math.round(s.t)}/${Math.round(s.d)}초`);
          break;
        }
        if (s.d && s.d > 0 && s.t >= s.d - 13) {
          const remainMs = Math.max(2000, Math.ceil((s.d - s.t + 2) * 1000));
          log('영상 종료 임박 대기', name, `${Math.round(s.t)}/${Math.round(s.d)}초 (${remainMs}ms 대기)`);
          await sleep(remainMs);
          log('영상 끝 도달(대기 완료)', name, `${Math.round(s.d)}/${Math.round(s.d)}초`);
          break;
        }
        if (s.paused) {
          await cmd('setMuted', true);
          await cmd('setVolume', 0);
          await cmd('play');
        }
        stuck = Math.abs(s.t - last) < 0.5 ? stuck + 1 : 0;
        last = s.t;
      } else {
        stuck++;
      }
      if (stuck >= 6) {
        log('재생 멈춤 감지 -> 새로고침 후 이어 재생', name, JSON.stringify(s));
        await p.reload({ waitUntil: 'domcontentloaded' });
        await sleep(6000);
        await cmd('setMuted', true);
        await cmd('setVolume', 0);
        await cmd('play');
        stuck = 0;
        last = -1;
      }
      await sleep(10000);
    }
    if (fs.existsSync(`${DIR}/stop.flag`)) { log('stop.flag 감지(재생 중) — 종료'); break; }
    await sleep(6000);
    await p.reload({ waitUntil: 'domcontentloaded' });
    await sleep(4000);
    let ok = await isDone();
    if (!ok) {
      const clicked = await p.evaluate(() => {
        const btn = document.querySelector('button[title="이 강의를 완료한 것으로 표시"]');
        if (btn) { btn.click(); return true; }
        return false;
      }).catch(() => false);
      if (clicked) {
        await sleep(3000);
        ok = await isDone();
      }
    }
    (ok ? status.done : status.failed).push(L.num);
    save();
    log(ok ? '완료됨 확인 → 다음 강의 자동 이동' : '완료 확인 실패', name);
  } catch (e) {
    status.failed.push(L.num);
    save();
    log('오류', name, String(e).slice(0, 200));
    await sleep(8000);
  }
}

status.current = null;
status.finished = new Date().toISOString();
save();
log('전체 재생 완료', `신규 완료 ${status.done.length} · 기존 완료 ${status.skipped.length} · 실패 ${status.failed.length}`);
process.exit(0);
