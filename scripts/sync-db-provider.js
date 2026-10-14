const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

if (fs.existsSync(schemaPath)) {
    try {
        let schema = fs.readFileSync(schemaPath, 'utf8');
        let dbUrl = (process.env.DATABASE_URL || '').trim();

        // Fallback to local .env file if not present in process.env
        if (!dbUrl) {
            const envPath = path.join(__dirname, '..', '.env');
            if (fs.existsSync(envPath)) {
                const envContent = fs.readFileSync(envPath, 'utf8');
                const match = envContent.match(/^DATABASE_URL\s*=\s*["']?([^"'\r\n]+)/m);
                if (match) dbUrl = match[1].trim();
            }
        }

        let targetProvider = 'postgresql'; // default for Railway production
        if (dbUrl.startsWith('mysql://')) {
            targetProvider = 'mysql';
        } else if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
            targetProvider = 'postgresql';
        }

        const providerRegex = /datasource\s+db\s*\{[\s\S]*?provider\s*=\s*["']([^"']+)["']/;
        const match = schema.match(providerRegex);

        if (match && match[1] !== targetProvider) {
            schema = schema.replace(
                /(datasource\s+db\s*\{[\s\S]*?provider\s*=\s*["'])([^"']+)(["'])/,
                `$1${targetProvider}$3`
            );
            fs.writeFileSync(schemaPath, schema, 'utf8');
            console.log(`[DB-Sync] Auto-switched Prisma provider from "${match[1]}" to "${targetProvider}" based on DATABASE_URL.`);
        }
    } catch (e) {
        console.error('[DB-Sync] Error syncing Prisma provider:', e.message);
    }
}
