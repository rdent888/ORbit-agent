import fs from 'fs';

const lines = fs.readFileSync('replica/features.csv', 'utf8').trim().split('\n');
let totalWeight = 0, achievedWeight = 0;
let mustTotal = 0, mustDone = 0;
const missing = [];

for (let i = 1; i < lines.length; i++) {
  const [feature, area, priority, original, clone, ...rest] = lines[i].split(',');
  if (!feature) continue;
  if (clone === 'skip') continue;

  const weight = priority === 'must' ? 3 : priority === 'should' ? 2 : 1;
  totalWeight += weight;

  if (priority === 'must') {
    mustTotal++;
    if (clone === 'yes') mustDone += 1;
    else if (clone === 'partial') mustDone += 0.5;
  }

  if (clone === 'yes') {
    achievedWeight += weight;
  } else if (clone === 'partial') {
    achievedWeight += weight * 0.5;
    missing.push({ feature, area, priority, status: 'partial' });
  } else {
    missing.push({ feature, area, priority, status: 'no' });
  }
}

const score = Math.round((achievedWeight / totalWeight) * 100);
console.log(`PARITY_SCORE:${score}`);
console.log(`MUST_DONE:${mustDone}/${mustTotal}`);
console.log(`TOTAL_FEATURES:${lines.length - 1}`);
console.log(`GAPS_COUNT:${missing.length}`);
