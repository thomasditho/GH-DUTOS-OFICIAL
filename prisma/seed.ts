import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  
  // Create Default Client
  const defaultClient = await prisma.client.upsert({
    where: { slug: 'formare' },
    update: {},
    create: {
      name: 'FORMARE',
      slug: 'formare',
      color: '#0A192F'
    }
  });

  // Create Admin
  await prisma.user.upsert({
    where: { email: 'admin@ghdutos.com.br' },
    update: {},
    create: {
      email: 'admin@ghdutos.com.br',
      name: 'Administrador GH',
      password: adminPassword,
      role: 'ADMIN',
      clientId: defaultClient.id
    }
  });

  // Create Operator
  const operatorPassword = await bcrypt.hash('op123', 10);
  await prisma.user.upsert({
    where: { email: 'operador@ghdutos.com.br' },
    update: {},
    create: {
      email: 'operador@ghdutos.com.br',
      name: 'Operador Técnico',
      password: operatorPassword,
      role: 'OPERATOR',
      clientId: defaultClient.id
    }
  });

  console.log('Seed completed: Client, Admin and Operator created.');

  // Create Sample Equipment
  const sampleEquipment = await prisma.equipment.upsert({
    where: { codigo: 'AC-DEMO-01' },
    update: {},
    create: {
      codigo: 'AC-DEMO-01',
      publicId: 'demo-ativo-01',
      tipo: 'Ar Condicionado Split',
      local: 'Sala de Servidores',
      andar: '3º Andar',
      status: 'OPERACIONAL',
      dataInstalacao: new Date('2024-01-15'),
      periodicidadeManutencao: 90,
      clientId: defaultClient.id,
      attributes: {
        create: [
          { key: 'Fabricante', value: 'Daikin' },
          { key: 'Capacidade', value: '60.000 BTUs' },
          { key: 'Modelo', value: 'SkyAir R-32' }
        ]
      },
      maintenances: {
        create: [
          {
            data: new Date('2024-04-15'),
            descricao: 'Limpeza de filtros e verificação de carga de gás.',
            responsavel: 'Técnico Roberto',
            observacao: 'Tudo em conformidade.'
          },
          {
            data: new Date('2024-07-15'),
            descricao: 'Troca de capacitor de partida e limpeza da condensadora.',
            responsavel: 'Técnico Silva',
            observacao: 'Peça substituída por desgaste preventivo.'
          }
        ]
      }
    }
  });

  console.log('Sample equipment created: AC-DEMO-01');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
