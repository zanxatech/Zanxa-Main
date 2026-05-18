const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

function walk(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            walk(filePath);
        } else if (filePath.endsWith('.js')) {
            let content = fs.readFileSync(filePath, 'utf-8');
            if (content.includes('new PrismaClient()') && !filePath.includes('lib/prisma.js')) {
                console.log(`Fixing ${filePath}`);
                
                // Determine relative path to lib/prisma
                const relativeDir = path.relative(path.dirname(filePath), path.join(srcDir, 'lib'));
                const prismaPath = path.join(relativeDir, 'prisma').replace(/\\/g, '/');
                
                // Remove the import and the instantiation
                content = content.replace(/const\s*{\s*PrismaClient\s*}\s*=\s*require\(['"]@prisma\/client['"]\);?\n?/g, '');
                content = content.replace(/const\s+prisma\s*=\s*new\s+PrismaClient\(.*\);?\n?/g, `const prisma = require('${prismaPath}');\n`);
                
                fs.writeFileSync(filePath, content);
            }
        }
    });
}

walk(srcDir);
console.log('Done fixing Prisma Client usage.');
