import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import multer from 'multer';
import fs from 'fs';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'gh-dutos-secret-2026';
const PORT = process.env.PORT || 3000;

// Setup multer for local uploads (fallback for Supabase/S3)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

async function startServer() {
  const app = express();
  app.use(express.json());

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  const checkAdmin = (req: any, res: any, next: any) => {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem realizar esta ação.' });
    }
    next();
  };

  // --- API ROUTES ---

  // Auth
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name, clientId: user.clientId }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name, clientId: user.clientId } });
  });

  // Print Settings
  app.get('/api/settings/print', authenticate, async (req, res) => {
    try {
      let settings = await prisma.printSettings.findFirst();
      if (!settings) {
        settings = await prisma.printSettings.create({
          data: {
            reportHeader: 'GH DUTOS - Sistemas de Manutenção',
            reportFooter: 'www.ghdutos.com.br | (11) 9999-9999',
            reportPrimaryColor: '#0A192F'
          }
        });
      }
      res.json(settings);
    } catch (err) {
      console.error('Get Print Settings Error:', err);
      res.status(500).json({ error: 'Erro ao carregar configurações' });
    }
  });

  app.post('/api/settings/print', authenticate, async (req, res) => {
    if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Acesso negado' });
    try {
      const data = req.body;
      const settings = await prisma.printSettings.upsert({
        where: { id: 1 },
        update: data,
        create: { ...data, id: 1 }
      });
      res.json(settings);
    } catch (err) {
      console.error('Update Print Settings Error:', err);
      res.status(500).json({ error: 'Erro ao salvar configurações' });
    }
  });

  // Dashboard Stats
  app.get('/api/dashboard/stats', authenticate, async (req: any, res) => {
    try {
      const { clientId: userClientId, role } = req.user;
      const queryClientId = req.query.clientId;
      
      // If admin and clientId provided in query, use it. Otherwise use user's clientId (if not admin)
      let clientId = role === 'ADMIN' ? (queryClientId ? parseInt(queryClientId as string) : undefined) : userClientId;
      
      const where: any = clientId ? { clientId } : {};

      const totalEquipments = await prisma.equipment.count({ where });
      const statusCounts = await prisma.equipment.groupBy({
        where,
        by: ['status'],
        _count: {
          _all: true
        }
      });
      const recentMaintenances = await prisma.maintenance.findMany({
        where: { equipment: where },
        take: 5,
        orderBy: { data: 'desc' },
        include: { equipment: true }
      });

      // Smart Maintenance Alerts
      const allEquipments = await prisma.equipment.findMany({
        where,
        include: {
          maintenances: {
            orderBy: { data: 'desc' },
            take: 1
          }
        }
      });

      const now = new Date();
      let overdue = 0;
      let upcoming = 0;

      const chartData: any[] = [];
      const monthlyMaintenances: { [key: string]: number } = {};

      // Calculate alerts and monthly stats
      allEquipments.forEach(eq => {
        if (!eq.periodicidadeManutencao) return;

        const lastMaintenance = eq.maintenances[0]?.data || eq.dataInstalacao || eq.createdAt;
        const nextMaintenance = new Date(lastMaintenance);
        nextMaintenance.setDate(nextMaintenance.getDate() + eq.periodicidadeManutencao);

        const diffDays = Math.ceil((nextMaintenance.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          overdue++;
        } else if (diffDays <= 15) {
          upcoming++;
        }
      });

      // Get maintenance counts for last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const maintenancesLast6Months = await prisma.maintenance.findMany({
        where: {
          data: {
            gte: sixMonthsAgo
          }
        }
      });

      maintenancesLast6Months.forEach(m => {
        const month = m.data.toLocaleString('pt-BR', { month: 'short' }).toUpperCase();
        monthlyMaintenances[month] = (monthlyMaintenances[month] || 0) + 1;
      });

      const performanceChart = Object.entries(monthlyMaintenances).map(([name, value]) => ({ name, value }));

      res.json({ 
        totalEquipments, 
        statusCounts, 
        recentMaintenances,
        maintenanceAlerts: { overdue, upcoming },
        performanceChart
      });
    } catch (err) {
      console.error('Dashboard Stats Error:', err);
      res.status(500).json({ error: 'Erro ao carregar estatísticas' });
    }
  });

  // Calendar Events
  app.get('/api/calendar/events', authenticate, async (req: any, res) => {
    try {
      const { clientId, role } = req.user;
      const where = role === 'ADMIN' ? {} : { clientId };

      const allEquipments = await prisma.equipment.findMany({
        where,
        include: {
          maintenances: {
            orderBy: { data: 'desc' },
            take: 1
          }
        }
      });

      const events: any[] = [];
      const now = new Date();
      const threeMonthsAhead = new Date();
      threeMonthsAhead.setMonth(threeMonthsAhead.getMonth() + 3);

      allEquipments.forEach(eq => {
        if (!eq.periodicidadeManutencao) return;

        const lastMaintenance = eq.maintenances[0]?.data || eq.dataInstalacao || eq.createdAt;
        let nextDate = new Date(lastMaintenance);
        
        // Project next dates for the next 3 months
        while (nextDate < threeMonthsAhead) {
          nextDate = new Date(nextDate);
          nextDate.setDate(nextDate.getDate() + eq.periodicidadeManutencao);
          
          if (nextDate >= now && nextDate <= threeMonthsAhead) {
            events.push({
              id: `${eq.id}-${nextDate.getTime()}`,
              equipmentId: eq.id,
              codigo: eq.codigo,
              tipo: eq.tipo,
              local: eq.local,
              date: nextDate.toISOString(),
              title: `Manutenção: ${eq.codigo}`
            });
          }
        }
      });

      res.json(events);
    } catch (err) {
      console.error('Calendar Events Error:', err);
      res.status(500).json({ error: 'Erro ao carregar eventos do calendário' });
    }
  });

  // Equipments
  app.get('/api/equipments', authenticate, async (req: any, res) => {
    const { clientId, role } = req.user;
    const where = role === 'ADMIN' ? {} : { clientId };
    
    const equipments = await prisma.equipment.findMany({
      where,
      include: { attributes: true, client: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(equipments);
  });

  app.post('/api/equipments', authenticate, async (req: any, res) => {
    const { codigo, tipo, local, andar, status, dataInstalacao, periodicidadeManutencao, attributes, clientId: bodyClientId } = req.body;
    const { clientId: userClientId, role } = req.user;
    
    // Use clientId from body if admin, otherwise use user's clientId
    const finalClientId = role === 'ADMIN' && bodyClientId ? parseInt(bodyClientId) : userClientId;

    const equipment = await prisma.equipment.create({
      data: {
        publicId: nanoid(10),
        codigo,
        tipo,
        local,
        andar,
        status,
        dataInstalacao: dataInstalacao ? new Date(dataInstalacao) : null,
        periodicidadeManutencao: parseInt(periodicidadeManutencao) || null,
        clientId: finalClientId,
        attributes: {
          create: attributes || []
        }
      }
    });
    res.json(equipment);
  });

  app.get('/api/equipments/:id', authenticate, async (req: any, res) => {
    const { clientId, role } = req.user;
    const where: any = { id: parseInt(req.params.id) };
    if (role !== 'ADMIN') where.clientId = clientId;

    const equipment = await prisma.equipment.findFirst({
      where,
      include: { attributes: true, maintenances: { orderBy: { data: 'desc' } }, client: true }
    });
    if (!equipment) return res.status(404).json({ error: 'Equipamento não encontrado ou acesso negado' });
    res.json(equipment);
  });

  app.put('/api/equipments/:id', authenticate, async (req: any, res) => {
    const { codigo, tipo, local, andar, status, dataInstalacao, periodicidadeManutencao, attributes, clientId: bodyClientId } = req.body;
    const { clientId: userClientId, role } = req.user;

    const existing = await prisma.equipment.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!existing) return res.status(404).json({ error: 'Equipamento não encontrado' });
    if (role !== 'ADMIN' && existing.clientId !== userClientId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    // Use clientId from body if admin, otherwise keep current or use user's
    const finalClientId = role === 'ADMIN' && bodyClientId ? parseInt(bodyClientId) : existing.clientId;

    // Delete old attributes and recreate (simple sync)
    await prisma.equipmentAttribute.deleteMany({ where: { equipmentId: parseInt(req.params.id) } });

    const equipment = await prisma.equipment.update({
      where: { id: parseInt(req.params.id) },
      data: {
        codigo,
        tipo,
        local,
        andar,
        status,
        dataInstalacao: dataInstalacao ? new Date(dataInstalacao) : null,
        periodicidadeManutencao: parseInt(periodicidadeManutencao) || null,
        clientId: finalClientId,
        attributes: {
          create: attributes || []
        }
      }
    });
    res.json(equipment);
  });

  app.delete('/api/equipments/:id', authenticate, async (req: any, res) => {
    try {
      const { clientId, role } = req.user;
      const existing = await prisma.equipment.findUnique({ where: { id: parseInt(req.params.id) } });
      
      if (!existing) return res.status(404).json({ error: 'Equipamento não encontrado' });
      if (role !== 'ADMIN' && existing.clientId !== clientId) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      await prisma.equipment.delete({
        where: { id: parseInt(req.params.id) }
      });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao excluir equipamento' });
    }
  });

  // Import Equipments from Excel
  app.post('/api/equipments/import', authenticate, upload.single('file'), async (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    
    const { clientId, mapping } = req.body;
    const parsedMapping = JSON.parse(mapping);
    const targetClientId = parseInt(clientId);

    if (!targetClientId) return res.status(400).json({ error: 'Cliente não selecionado' });

    try {
      const workbook = XLSX.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      const results = {
        success: 0,
        errors: [] as string[]
      };

      for (const row of data as any[]) {
        try {
          const codigo = row[parsedMapping.codigo]?.toString().toUpperCase();
          const tipo = row[parsedMapping.tipo]?.toString().toUpperCase();
          const local = row[parsedMapping.local]?.toString().toUpperCase();
          const andar = row[parsedMapping.andar]?.toString().toUpperCase();
          const periodicidade = parseInt(row[parsedMapping.periodicidade]) || null;

          if (!codigo || !tipo || !local) {
            results.errors.push(`Linha ignorada: Campos obrigatórios ausentes para ${codigo || 'item sem código'}`);
            continue;
          }

          // Check if already exists
          const existing = await prisma.equipment.findUnique({ where: { codigo } });
          if (existing) {
            results.errors.push(`Erro: Código ${codigo} já existe no sistema.`);
            continue;
          }

          // Extract extra attributes
          const attributes: any[] = [];
          Object.keys(row).forEach(key => {
            // If key is not one of the mapped standard fields, add as attribute
            const isMapped = Object.values(parsedMapping).includes(key);
            if (!isMapped && row[key] !== undefined && row[key] !== null) {
              attributes.push({
                key: key.toUpperCase(),
                value: row[key].toString().toUpperCase()
              });
            }
          });

          await prisma.equipment.create({
            data: {
              publicId: nanoid(10),
              codigo,
              tipo,
              local,
              andar: andar || 'N/A',
              status: 'OPERACIONAL',
              periodicidadeManutencao: periodicidade,
              clientId: targetClientId,
              attributes: {
                create: attributes
              }
            }
          });
          results.success++;
        } catch (err: any) {
          results.errors.push(`Erro ao processar linha: ${err.message}`);
        }
      }

      // Clean up file
      fs.unlinkSync(req.file.path);

      res.json(results);
    } catch (err) {
      console.error('Import Error:', err);
      res.status(500).json({ error: 'Erro ao processar arquivo Excel' });
    }
  });

  // Public Equipment Route
  app.get('/api/public/equipment/:publicId', async (req, res) => {
    const equipment = await prisma.equipment.findUnique({
      where: { publicId: req.params.publicId },
      include: { attributes: true, maintenances: { orderBy: { data: 'desc' } } }
    });
    if (!equipment) return res.status(404).json({ error: 'Equipamento não encontrado' });
    res.json(equipment);
  });

  // Maintenances
  app.get('/api/maintenances', authenticate, async (req: any, res) => {
    const { clientId, role } = req.user;
    const where = role === 'ADMIN' ? {} : { equipment: { clientId } };

    const maintenances = await prisma.maintenance.findMany({
      where,
      include: { equipment: true },
      orderBy: { data: 'desc' }
    });
    res.json(maintenances);
  });

  app.post('/api/maintenances', authenticate, upload.single('arquivo'), async (req, res) => {
    const { equipmentId, data, descricao, responsavel, observacao } = req.body;
    const arquivoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const maintenance = await prisma.maintenance.create({
      data: {
        equipmentId: parseInt(equipmentId),
        data: new Date(data),
        descricao,
        responsavel,
        observacao,
        arquivoUrl
      }
    });
    res.json(maintenance);
  });

  // User Management
  app.get('/api/users', authenticate, checkAdmin, async (req, res) => {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  });

  app.post('/api/users', authenticate, checkAdmin, async (req, res) => {
    const { email, password, name, role } = req.body;
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const user = await prisma.user.create({
        data: { email, password: hashedPassword, name, role }
      });
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err) {
      res.status(400).json({ error: 'Email já cadastrado' });
    }
  });

  app.put('/api/users/:id', authenticate, checkAdmin, async (req, res) => {
    const { email, password, name, role } = req.body;
    const data: any = { email, name, role };
    if (password) {
      data.password = bcrypt.hashSync(password, 10);
    }
    try {
      const user = await prisma.user.update({
        where: { id: parseInt(req.params.id) },
        data
      });
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err) {
      res.status(400).json({ error: 'Erro ao atualizar usuário' });
    }
  });

  app.delete('/api/users/:id', authenticate, checkAdmin, async (req, res) => {
    try {
      await prisma.user.delete({ where: { id: parseInt(req.params.id) } });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao excluir usuário' });
    }
  });

  // Clients Management (Admin only)
  app.get('/api/clients', authenticate, checkAdmin, async (req, res) => {
    const clients = await prisma.client.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(clients);
  });

  app.post('/api/clients', authenticate, checkAdmin, async (req, res) => {
    const { name, slug, color, logoUrl } = req.body;
    try {
      const client = await prisma.client.create({
        data: { name, slug, color, logoUrl }
      });
      res.json(client);
    } catch (err) {
      res.status(400).json({ error: 'Erro ao criar cliente. Verifique se o nome ou slug já existem.' });
    }
  });

  app.put('/api/clients/:id', authenticate, checkAdmin, async (req, res) => {
    const { name, slug, color, logoUrl } = req.body;
    try {
      const client = await prisma.client.update({
        where: { id: parseInt(req.params.id) },
        data: { name, slug, color, logoUrl }
      });
      res.json(client);
    } catch (err) {
      res.status(400).json({ error: 'Erro ao atualizar cliente' });
    }
  });

  app.delete('/api/clients/:id', authenticate, checkAdmin, async (req, res) => {
    try {
      await prisma.client.delete({ where: { id: parseInt(req.params.id) } });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao excluir cliente' });
    }
  });

  // Serve uploads
  app.use('/uploads', express.static('uploads'));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
