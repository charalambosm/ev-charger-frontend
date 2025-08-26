const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'assets', 'charging_points_export.json');
const backupPath = path.join(__dirname, '..', 'assets', 'charging_points_export.backup.json');

function toNumber(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  const str = String(value).trim();
  // Extract digits if any
  const digitStr = (str.match(/\d+/g) || []).join('');
  if (digitStr.length === 0) return null;
  const parsed = Number(digitStr);
  return Number.isFinite(parsed) ? parsed : null;
}

function main() {
  const raw = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) {
    throw new Error('Expected top-level array in charging_points_export.json');
  }

  let changed = 0;
  const updated = data.map((item) => {
    if (item && Object.prototype.hasOwnProperty.call(item, 'postcode')) {
      const before = item.postcode;
      const after = toNumber(before);
      if (after !== before) changed += 1;
      return { ...item, postcode: after };
    }
    return item;
  });

  // Backup original once per run
  if (!fs.existsSync(backupPath)) {
    fs.writeFileSync(backupPath, raw);
  }

  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2) + '\n');
  console.log(`Postcode conversion complete. Records changed: ${changed}`);
}

main();


