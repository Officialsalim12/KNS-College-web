(function loadEnv() {
    const fs = require('fs');
    const path = require('path');
    const root = path.join(__dirname, '..', '..');
    for (const name of ['.env.local', '.env', '.env.production']) {
        const full = path.join(root, name);
        if (fs.existsSync(full)) {
            require('dotenv').config({ path: full });
            break;
        }
    }
})();

const { query, isDbConfigured, closePool } = require('./pg');

async function main() {
    if (!isDbConfigured()) {
        console.error('DATABASE_URL is not set.');
        process.exit(1);
    }

    console.log('Deleting scholarship...');

    try {
        await query("DELETE FROM scholarships WHERE title = 'KNS DIPLOMA PARTIAL SCHOLARSHIP 2026'");
        console.log('Scholarship deleted successfully.');
    } catch (err) {
        console.error('Error deleting scholarship:', err.message);
        throw err;
    }

    await closePool();
}

main().catch(async (err) => {
    console.error('Scholarship deletion failed:', err.message);
    await closePool();
    process.exit(1);
});
