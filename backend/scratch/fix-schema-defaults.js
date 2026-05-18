const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf-8');

// 1. Identify all enums
const enumRegex = /enum\s+(\w+)\s*{([\s\S]*?)}/g;
const enums = {};
let match;
while ((match = enumRegex.exec(schema)) !== null) {
    const enumName = match[1];
    const values = match[2].trim().split(/\s+/);
    enums[enumName] = values;
}

console.log(`Found enums: ${Object.keys(enums).join(', ')}`);

// 2. Replace enum usages in models with String and fix defaults
Object.keys(enums).forEach(enumName => {
    // Replace field type
    const typeRegex = new RegExp(`(\\w+)\\s+${enumName}(\\s|\\n|\\[|\\?)`, 'g');
    schema = schema.replace(typeRegex, (match, fieldName, suffix) => {
        return `${fieldName} String${suffix}`;
    });

    // Fix defaults: @default(VALUE) -> @default("VALUE")
    enums[enumName].forEach(value => {
        if (!value) return;
        const defaultRegex = new RegExp(`@default\\(${value}\\)`, 'g');
        schema = schema.replace(defaultRegex, `@default("${value}")`);
    });
});

// 3. Remove enum definitions
schema = schema.replace(enumRegex, '');

fs.writeFileSync(schemaPath, schema);
console.log('Schema defaults fixed for SQLite.');
