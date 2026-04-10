# Guia da API - GH DUTOS

A API é construída sobre Express e utiliza JSON para troca de dados.

## 1. Autenticação
Todas as rotas privadas exigem o header:
`Authorization: Bearer <JWT_TOKEN>`

- `POST /api/auth/login`: Autentica usuário e retorna token.

## 2. Equipamentos (Ativos)
- `GET /api/equipments`: Lista todos os ativos (respeitando o filtro de cliente).
- `GET /api/equipments/:id`: Detalhes completos de um ativo.
- `POST /api/equipments`: Cria novo ativo.
- `PUT /api/equipments/:id`: Atualiza dados do ativo.
- `DELETE /api/equipments/:id`: Remove ativo.

## 3. Importação (Excel)
- `POST /api/equipments/import`: Recebe um arquivo `.xlsx` e um mapeamento de colunas JSON para criação em massa.

## 4. Manutenções
- `POST /api/maintenances`: Registra nova intervenção (suporta upload de PDF via Multer).
- `GET /api/maintenances`: Lista histórico global.

## 5. Público (QR Code)
- `GET /api/public/equipment/:publicId`: Rota sem autenticação para visualização rápida via escaneamento de QR Code.

## 6. Configurações
- `GET /api/settings/print`: Retorna configurações de layout de impressão.
- `POST /api/settings/print`: Salva novas configurações de layout.
