// etl.js - Upgraded Challenge Version
const fs = require("fs");
const path = require("path");

const USERS_API_URL = 'https://jsonplaceholder.typicode.com/users';
const POSTS_API_URL = 'https://jsonplaceholder.typicode.com/posts';

// ==========================================
// 1. EXTRACT (Challenge B: Keeps errors throwing so main handles them)
// ==========================================
async function extract(url) {
    console.log('[EXTRACT] Fetching:', url);
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status} on URL: ${url}`);
    }
    const data = await response.json();
    console.log('[EXTRACT] Got', data.length, 'records.');
    return data;
}

// ==========================================
// 2. TRANSFORM (Includes Challenge A & Challenge C)
// ==========================================
function transform(users, posts) {
    console.log('[TRANSFORM] Processing and matching user posts...');

    const rows = users.map(user => {
        // CHALLENGE A: Count how many posts belong to this user's ID
        const userPosts = posts.filter(post => post.userId === user.id);
        const postCount = userPosts.length;

        return {
            id: user.id,
            name: user.name.trim(),
            username: user.username.toLowerCase(),
            email: user.email.toLowerCase(),
            phone: user.phone.split(' ')[0],
            city: user.address.city,
            zipcode: user.address.zipcode,
            lat: parseFloat(user.address.geo.lat),
            lng: parseFloat(user.address.geo.lng),
            company: user.company.name,
            postCount: postCount // CHALLENGE A: Added column
        };
    });

    // CHALLENGE C: Filter to only keep users with a negative latitude (Southern Hemisphere)
    const southernHemisphereUsers = rows.filter(r => r.lat < 0);
    
    console.log('[TRANSFORM] Clean records matching Southern Hemisphere (lat < 0):', southernHemisphereUsers.length);
    return southernHemisphereUsers;
}

// ==========================================
// 3. LOAD
// ==========================================
function load(rows) {
    console.log('[LOAD] Writing', rows.length, 'rows to CSV...');
    
    if (rows.length === 0) {
        console.log('[LOAD] No records to save.');
        return;
    }

    const headers = Object.keys(rows[0]);
    const lines = rows.map(row => headers.map(h => `"${row[h]}"`).join(","));
    const csv = [headers.join(","), ...lines].join("\n");
    
    const filePath = path.join(__dirname, "output.csv");
    fs.writeFileSync(filePath, csv, 'utf8');
    console.log('[LOAD] Saved to output.csv successfully.');
}

// ==========================================
// MAIN CONTROL (Challenge B: Error Handling Wrap)
// ==========================================
async function main() {
    try {
        console.log('--- STARTING ETL PIPELINE ---');
        
        // Challenge A: Extracting from both endpoints
        const rawUsers = await extract(USERS_API_URL);
        const rawPosts = await extract(POSTS_API_URL);
        
        // Pass both sets of data into transform
        const cleanData = transform(rawUsers, rawPosts);
        
        // Preview the outcome
        console.table(cleanData);
        
        // Load into CSV
        load(cleanData);
        
        console.log('--- ETL PIPELINE COMPLETE ---');
    } catch (error) {
        // CHALLENGE B: Friendly error catch message
        console.error('\n[!! PIPELINE CRASHED !!]');
        console.error(`Reason: ${error.message}`);
        console.error('Please verify your internet connection or check if your API URL endpoints are spelled correctly.\n');
    }
}

main();