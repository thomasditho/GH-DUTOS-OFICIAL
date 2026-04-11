import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const clients = await prisma.client.findMany();
  console.log('Clientes:', clients.map(c => ({ id: c.id, name: c.name })));

  const equipments = await prisma.equipment.findMany({
    include: { client: true }
  });
  console.log('Total de Equipamentos:', equipments.length);
  if (equipments.length > 0) {
    console.log('Primeiros 5 equipamentos:', equipments.slice(0, 5).map(e => ({
      id: e.id,
      codigo: e.codigo,
      client: e.client?.name
    })));
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
