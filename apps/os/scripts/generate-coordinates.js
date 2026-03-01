const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '..', '골프장_정보.md');
const outputPath = path.join(__dirname, '..', 'src', 'constants', 'golfCourseCoordinates.json');

const content = fs.readFileSync(inputPath, 'utf-8');
const lines = content.split('\n');

const result = {};

for (const line of lines) {
  // Skip non-table rows, header rows, and separator rows
  if (!line.startsWith('|')) continue;
  if (line.includes('------')) continue;
  if (line.includes('골프장명')) continue;

  const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell !== '');

  // Expected: [골프장명, 홀수, 주소, 회원제/퍼블릭, 위도, 경도]
  if (cells.length < 6) continue;

  const name = cells[0];
  const address = cells[2];
  const latStr = cells[4];
  const lngStr = cells[5];

  // Skip rows with empty or invalid lat/lng
  if (!latStr || !lngStr || latStr === 'null' || lngStr === 'null') continue;

  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);

  if (isNaN(lat) || isNaN(lng)) continue;

  // Keep the first entry if the same address already exists
  if (result[address]) continue;

  result[address] = { name, lat, lng };
}

// Sort entries alphabetically by address key
const sortedKeys = Object.keys(result).sort();
const sorted = {};
for (const key of sortedKeys) {
  sorted[key] = result[key];
}

// Ensure the output directory exists
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(sorted, null, 2) + '\n', 'utf-8');

console.log(`Generated ${Object.keys(sorted).length} entries`);
console.log(`Output: ${outputPath}`);
