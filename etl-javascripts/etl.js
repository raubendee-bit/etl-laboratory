// etl.js — Lab 1: Fetch & ETL with Node.js
const fs   = require("fs");
const path = require("path");
 
const API_URL = 'https://jsonplaceholder.typicode.com/users';
 
// ── 1. EXTRACT ────────────────────────────────────
    // TODO in Exercise 1
async function extract(url) {
    console.log('[EXTRACT] Fetching:', url);
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error('HTTP error' + response.status);
    }
    const data = await response.json();
    console.log('[EXTRACT] Got', data.length, 'records.');
    console.log(data[0]);
    return data;
}
 
// ── 2. TRANSFORM ──────────────────────────────────
    // TODO in Exercise 2
function transform(users) {
  console.log('[TRANSFORM] Cleaning', users.length, 'records...');
 
  const rows = users.map(user => {
    return {
      id:           user.id,
      name:         user.name.trim(),
      username:     user.username.toLowerCase(),
      email:        user.email.toLowerCase(),
      phone:        user.phone.split(' ')[0],   // keep only the main number
      city:         user.address.city,
      zipcode:      user.address.zipcode,
      lat:          parseFloat(user.address.geo.lat),
      lng:          parseFloat(user.address.geo.lng),
      company:      user.company.name,
    };
  });
 
  // Filter out any records with invalid email
  const clean = rows.filter(r => r.email.includes('@'));
 
  console.log('[TRANSFORM] Clean records:', clean.length);
  return clean;
}

 
// ── 3. LOAD ───────────────────────────────────────
// TODO in Exercise 3
function load(rows) {
  console.log('[LOAD] Writing', rows.length, 'rows to CSV...');
 
  // Build the header row from the keys of the first object
  const headers = Object.keys(rows[0]);
 
  // Build each data row
  const lines = rows.map(row => {
    return headers.map(h => `"${row[h]}"`).join(",");
  });
 
  // Join header + data rows with newlines
  const csv = [headers.join(","), ...lines].join("\n");
 
  // Write to file
  const filePath = path.join(__dirname, "output.csv");
  fs.writeFileSync(filePath, csv, 'utf8');
 
  console.log('[LOAD] Saved to output.csv');
}

// ── MAIN ──────────────────────────────────────────
async function main() {
  const raw   = await extract(API_URL);
  const clean = transform(raw);
  console.table(clean);
  load(clean);
}
 
main();
