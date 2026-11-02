const Database = require('better-sqlite3');
const { MongoClient } = require('mongodb');
const path = require('path');

async function migrate() {
  const dbPath = path.resolve(__dirname, 'desktop_support.db');
  console.log('Connecting to SQLite at:', dbPath);
  const sqlite = new Database(dbPath);

  const mongoUri = 'mongodb://127.0.0.1:27017';
  const mongoDbName = 'desktop_support';
  console.log(`Connecting to MongoDB at: ${mongoUri}/${mongoDbName}`);
  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db(mongoDbName);
  console.log('Connected to MongoDB successfully!');

  // Query all user tables in SQLite
  const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '%upgraded%'").all();
  console.log('Found tables in SQLite:', tables.map(t => t.name));

  const summary = {};

  for (const table of tables) {
    const tableName = table.name;
    const rows = sqlite.prepare(`SELECT * FROM "${tableName}"`).all();
    console.log(`Migrating table '${tableName}' (${rows.length} rows)...`);

    const collection = db.collection(tableName);
    // Clear existing docs if any to keep cleanly synced
    await collection.deleteMany({});

    if (rows.length > 0) {
      // Map SQLite records: keep original id as sqlite_id, or preserve id
      const docs = rows.map(row => ({
        ...row,
        migrated_at: new Date()
      }));
      await collection.insertMany(docs);
    }
    summary[tableName] = rows.length;
  }

  console.log('\n--- MIGRATION SUMMARY ---');
  for (const [tbl, count] of Object.entries(summary)) {
    console.log(`Collection '${tbl}': ${count} documents imported into MongoDB.`);
  }

  // Also create helpful indexes
  await db.collection('users').createIndex({ email: 1 });
  await db.collection('devices').createIndex({ asset_tag: 1 });
  await db.collection('tickets').createIndex({ ticket_number: 1 });
  await db.collection('attendance').createIndex({ employee_id: 1, attendance_date: 1 });

  console.log('Indexes created successfully.');
  await client.close();
  sqlite.close();
  console.log('MongoDB migration completed successfully!');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});

