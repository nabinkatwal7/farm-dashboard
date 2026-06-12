const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const farmDb = p;
const modelName = "weatherStation";
const delegate = farmDb[modelName];
console.log("modelName:", modelName);
console.log("delegate exists:", !!delegate);
console.log("delegate type:", typeof delegate);
console.log("has create:", typeof delegate?.create);
console.log("create is function:", typeof delegate?.create === "function");
if (delegate) {
  try {
    const result = delegate.create({ data: { farmId: "test", name: "Test", provider: "test", isActive: true } });
    console.log("create returned:", typeof result, result instanceof Promise ? "Promise" : "NOT Promise");
  } catch (e) {
    console.log("create error:", e.message);
  }
}
p.$disconnect().catch(()=>{});
