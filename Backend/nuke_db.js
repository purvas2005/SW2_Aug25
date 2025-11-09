// nuke_db.js
const { MongoClient } = require('mongodb');

// ⚠️ WARNING: HARDCODING CREDENTIALS IS NOT RECOMMENDED FOR PRODUCTION.
// DO NOT COMMIT THIS FILE TO GIT IF IT CONTAINS YOUR REAL URI.
const MONGO_URI = "mongodb+srv://pes1ug23cs456_db_user:14gXYfMSESSF1n1o@cluster0.kx945v3.mongodb.net/?appName=Cluster0";

const client = new MongoClient(MONGO_URI);

async function nuke() {
    try {
        console.log("🔌 Connecting to MongoDB Atlas...");
        await client.connect();
        console.log("✅ Connected.");

        // 1. List all databases
        const adminDb = client.db().admin();
        const { databases } = await adminDb.listDatabases();

        // 2. Filter out system databases that should not be touched
        const systemDbs = ['admin', 'config', 'local'];
        const userDbs = databases.filter(db => !systemDbs.includes(db.name));

        if (userDbs.length === 0) {
            console.log("✨ No user databases found to delete.");
            return;
        }

        // ⚠️ FINAL WARNING PROMPT COULD GO HERE IF INTERACTIVE ⚠️
        console.log(`🔥 FOUND ${userDbs.length} DATABASES TO INCINERATE:`, userDbs.map(d => d.name));
        console.log("Waiting 5 seconds before destruction... (Ctrl+C to cancel)");
        await new Promise(resolve => setTimeout(resolve, 5000));

        // 3. Drop each user database
        for (const dbInfo of userDbs) {
            const dbName = dbInfo.name;
            console.log(`💥 Dropping database: ${dbName}...`);
            await client.db(dbName).dropDatabase();
        }

        console.log("☠️ COMPLETE: All user databases have been dropped.");

    } catch (error) {
        console.error("❌ Error during nuke operation:", error);
    } finally {
        await client.close();
        console.log("🔌 Disconnected.");
    }
}

nuke();