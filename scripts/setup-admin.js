const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
    const email = (process.argv[2] || process.env.ADMIN_EMAIL || "").trim();
    const password = (process.argv[3] || process.env.ADMIN_PASSWORD || "").trim();

    if (!email) {
        console.log("No ADMIN_EMAIL provided. Skipping auto-admin setup.");
        return;
    }

    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        console.log(`User ${email} found. Promoting to SUPERADMIN and updating password...`);
        const updateData = { role: 'SUPERADMIN' };
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }
        await prisma.user.update({
            where: { email },
            data: updateData
        });
        console.log("User promoted and password updated successfully!");
    } else {
        if (!password) {
            console.log("Password not provided for new user. Skipping admin creation.");
            return;
        }

        console.log(`Creating new SUPERADMIN user ${email}...`);
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await prisma.user.create({
            data: {
                email,
                name: "Super Admin",
                password: hashedPassword,
                role: 'SUPERADMIN'
            }
        });
        console.log("Super Admin created successfully!");
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
