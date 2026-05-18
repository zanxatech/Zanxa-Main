const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf-8');

// List of common enum defaults in this project
const commonDefaults = [
    'PENDING', 'APPROVED', 'REJECTED', 'USER', 'ADMIN', 'EMPLOYEE', 
    'NOT_ELIGIBLE', 'CREATED', 'PAID', 'PENDING_PAYMENT', 'SUSPENDED',
    'WAITING_APPROVAL', 'PAYMENT_SUBMITTED', 'COURSES', 'CREATIVE_DESIGN'
];

commonDefaults.forEach(value => {
    const defaultRegex = new RegExp(`@default\\(${value}\\)`, 'g');
    schema = schema.replace(defaultRegex, `@default("${value}")`);
});

fs.writeFileSync(schemaPath, schema);
console.log('Fixed default values in schema.');
