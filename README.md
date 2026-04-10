# GH DUTOS - Gestão de Ativos Industrial

Sistema profissional de rastreabilidade de equipamentos e gestão de manutenção técnica via QR Code.

## 🚀 Visão Geral

O **GH DUTOS Asset Manager** é uma solução Full-Stack desenvolvida para a gestão eficiente de ativos industriais. O sistema permite o controle total de inventário, histórico de manutenções e geração de etiquetas inteligentes para acesso rápido via dispositivos móveis.

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide React.
- **Backend:** Node.js, Express.
- **Banco de Dados:** SQLite com Prisma ORM.
- **Relatórios:** jsPDF, XLSX (Excel).
- **Identificação:** QR Code dinâmico.

## 📂 Estrutura do Projeto

- `/src`: Código fonte do Frontend (React).
- `/server.ts`: Servidor Backend Express.
- `/prisma`: Esquema do banco de dados e migrações.
- `/docs`: Documentação técnica completa do sistema.

## 📖 Documentação

Para informações detalhadas sobre a arquitetura, banco de dados e guias de uso, consulte a pasta [`/docs`](./docs):

1. [Arquitetura do Sistema](./docs/ARCHITECTURE.md)
2. [Modelo de Banco de Dados](./docs/DATABASE.md)
3. [Guia da API](./docs/API_GUIDE.md)
4. [Manual do Usuário](./docs/USER_MANUAL.md)
5. [Plano de Testes](./docs/TESTING_GUIDE.md)
6. [Guia de Implantação (Deploy)](./docs/DEPLOYMENT.md)

## 🔧 Instalação e Desenvolvimento

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure o banco de dados:
   ```bash
   npx prisma db push
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

---
Desenvolvido por **Thomas Gabriel - Dev FullStack**
