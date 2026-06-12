const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const keys = Object.getOwnPropertyNames(p).filter(k => k[0] === k[0].toLowerCase() && !k.startsWith('_') && !k.startsWith('$'));
console.log(JSON.stringify(keys, null, 2));
p.$disconnect().catch(()=>{});
