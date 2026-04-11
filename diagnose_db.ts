
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnose() {
  console.log("--- INICIANDO DIAGNÓSTICO DE BANCO DE DADOS ---");
  
  try {
    const clients = await prisma.client.findMany();
    console.log(`\n👥 Clientes cadastrados: ${clients.length}`);
    clients.forEach(c => console.log(`   - ID: ${c.id} | Nome: ${c.name} | Slug: ${c.slug}`));

    const equipments = await prisma.equipment.findMany();
    console.log(`\n🛠️ Equipamentos no banco: ${equipments.length}`);
    equipments.forEach(e => console.log(`   - TAG: ${e.codigo} | ClienteID: ${e.clientId}`));

    if (equipments.length > 0) {
      console.log("\n⚠️ ATENÇÃO: Existem equipamentos no banco. Isso pode causar erro de duplicidade se a planilha for a mesma.");
    }

  } catch (err) {
    console.error("❌ Erro no diagnóstico:", err);
  } finally {
    await prisma.$disconnect();
  }
}

diagnose();
