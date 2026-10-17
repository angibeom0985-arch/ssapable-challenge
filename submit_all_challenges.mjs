import { chromium } from 'playwright-core';
import fs from 'fs';

const PLAN_PATH = 'D:/인풋/01 바이브코딩/쌉파서블 2/챌린지 제출/challenges_submission_plan.json';
const RESULT_PATH = 'D:/인풋/01 바이브코딩/쌉파서블 2/챌린지 제출/submission_result.json';
const SCREENSHOT_PATH = 'D:/인풋/01 바이브코딩/쌉파서블 2/챌린지 제출/00_챌린지_51개_전수제출완료_인증.png';

const plan = JSON.parse(fs.readFileSync(PLAN_PATH, 'utf8'));
const sleep = ms => new Promise(r => setTimeout(r, ms));

const b = await chromium.connectOverCDP('http://127.0.0.1:9665', { timeout: 20000 });
const ctx = b.contexts()[0];
// 첫 번째 탭(ctx.pages()[0])은 백그라운드 영상 자동 재생기가 사용 중이므로 절대 건드리지 않고 새 탭(p2)을 연다.
const p2 = await ctx.newPage();

const results = {
  startedAt: new Date().toISOString(),
  total: plan.length,
  submitted: [],
  alreadySubmitted: [],
  failed: []
};
const saveResult = () => fs.writeFileSync(RESULT_PATH, JSON.stringify(results, null, 2), 'utf8');

console.log(`[챌린지 자동 제출 시작] 총 ${plan.length}개 강의`);

for (let i = 0; i < plan.length; i++) {
  const item = plan[i];
  const label = `[${i + 1}/${plan.length}] ${item.num}강 (lessonId=${item.lessonId})`;
  try {
    await p2.goto(item.href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await p2.waitForSelector('#lesson-comments', { timeout: 20000 });
    await sleep(1000);

    // 이미 이번 챌린지(ssapable-challenge 또는 내 댓글 + 챌린지 제출)가 등록되어 있는지 확인
    const already = await p2.evaluate((fileName) => {
      const sec = document.querySelector('#lesson-comments');
      if (!sec) return false;
      const items = Array.from(sec.querySelectorAll('li'));
      return items.some(li => {
        const t = li.innerText || '';
        return t.includes('내 댓글') && t.includes('챌린지 제출') && (t.includes('ssapable-challenge') || t.includes(fileName));
      });
    }, item.fileName);

    if (already) {
      console.log(`${label} -> 이미 제출됨 (건너뜀)`);
      results.alreadySubmitted.push({ num: item.num, lessonId: item.lessonId, href: item.href });
      saveResult();
      continue;
    }

    const ta = p2.locator('#lesson-comments textarea').first();
    await ta.waitFor({ state: 'visible', timeout: 15000 });
    await ta.fill(item.comment);
    await sleep(400);

    const regBtn = p2.locator('#lesson-comments button').filter({ hasText: /^등록$/ }).first();
    await regBtn.click();

    // 등록 완료 대기 (textarea가 비워지고 '내 댓글' 배지가 나타날 때까지)
    await p2.waitForFunction(() => {
      const sec = document.querySelector('#lesson-comments');
      const t = sec?.querySelector('textarea');
      return sec && t && t.value === '' && sec.innerText.includes('내 댓글') && sec.innerText.includes('챌린지 제출');
    }, { timeout: 25000 });

    console.log(`${label} -> 제출 완료!`);
    results.submitted.push({ num: item.num, lessonId: item.lessonId, href: item.href, fileName: item.fileName, submittedAt: new Date().toISOString() });
    saveResult();
    await sleep(900);
  } catch (err) {
    console.error(`${label} -> 오류:`, err.message);
    results.failed.push({ num: item.num, lessonId: item.lessonId, href: item.href, error: String(err.message).slice(0, 200) });
    saveResult();
    await sleep(2000);
  }
}

// 제출 현황 페이지 확인 및 인증 스크린샷 저장
try {
  await p2.goto('https://ssapable.com/my/challenges', { waitUntil: 'networkidle', timeout: 45000 });
  await sleep(2000);
  const summaryText = await p2.evaluate(() => document.body.innerText.slice(0, 1500));
  results.myChallengesSummary = summaryText;
  await p2.screenshot({ path: SCREENSHOT_PATH, fullPage: true });
  console.log('[인증 캡처 저장 완료]', SCREENSHOT_PATH);
} catch (err) {
  console.error('[현황 확인 오류]', err.message);
}

results.finishedAt = new Date().toISOString();
saveResult();

await p2.close();
await b.close();
console.log(`[전체 완료] 신규 제출: ${results.submitted.length}, 기제출: ${results.alreadySubmitted.length}, 실패: ${results.failed.length}`);
process.exit(0);
