
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function reset() {
  console.log("--- INICIANDO LIMPEZA DE DADOS (RESET) ---");
  
  try {
    // Delete in order to respect foreign keys
    const d1 = await prisma.equipmentAttribute.deleteMany({});
    console.log(`✅ Atributos removidos: ${d1.count}`);
    
    const d2 = await prisma.maintenance.deleteMany({});
    console.log(`✅ Manutenções removidas: ${d2.count}`);
    
    const d3 = await prisma.equipment.deleteMany({});
    console.log(`✅ Equipamentos removidos: ${d3.count}`);
    
    console.log("\n--- LIMPEZA CONCLUÍDA COM SUCESSO ---");
  } catch (err) {
    console.error("❌ Erro ao resetar dados:", err);
  } finally {
    await prisma.$disconnect();
  }
}

reset();
