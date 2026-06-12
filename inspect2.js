const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const ws = p.weatherStation;
console.log('weatherStation exists:', !!ws);
console.log('type:', typeof ws);
console.log('keys:', Object.keys(ws).filter(k => !k.startsWith('_')));
p.$disconnect().catch(()=>{});
