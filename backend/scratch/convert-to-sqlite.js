const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf-8');

// 1. Identify all enums
const enumRegex = /enum\s+(\w+)\s*{[\s\S]*?}/g;
const enums = [];
let match;
while ((match = enumRegex.exec(schema)) !== null) {
    enums.push(match[1]);
}

console.log(`Found enums: ${enums.join(', ')}`);

// 2. Replace enum usages in models with String
enums.forEach(enumName => {
    // Replace "field EnumName" with "field String"
    // Also handle arrays like "field EnumName[]"
    const fieldRegex = new RegExp(`(\\w+)\\s+${enumName}(\\s|\\n|\\[|\\?)`, 'g');
    schema = schema.replace(fieldRegex, (match, fieldName, suffix) => {
        return `${fieldName} String${suffix}`;
    });
});

// 3. Remove enum definitions
schema = schema.replace(enumRegex, '');

// 4. Handle Json fields (SQLite doesn't support them in some versions, but Prisma 5+ does as String)
// We'll leave them for now.

fs.writeFileSync(schemaPath, schema);
console.log('Schema converted to SQLite compatible format.');
