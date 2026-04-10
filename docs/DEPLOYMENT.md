# Guia de Implantação (Deploy) - GH DUTOS

Este guia descreve como colocar o sistema em produção.

## 1. Requisitos do Servidor
- Node.js 18 ou superior.
- NPM ou Yarn.
- Acesso ao terminal (SSH).

## 2. Preparação do Ambiente
1. Clone o repositório no servidor.
2. Crie um arquivo `.env` baseado no `.env.example`.
3. Defina uma `JWT_SECRET` forte.

## 3. Build e Inicialização
Execute os comandos abaixo na raiz do projeto:

```bash
# Instalar dependências de produção
npm install --omit=dev

# Gerar o cliente do banco de dados
npx prisma generate

# Aplicar migrações ao banco de dados de produção
npx prisma db push

# Gerar o build do Frontend
npm run build
```

## 4. Gerenciamento de Processos (PM2)
Recomendamos o uso do PM2 para manter o sistema rodando:

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar o servidor
pm2 start server.ts --name "gh-dutos-api" --interpreter tsx
```

## 5. Proxy Reverso (Nginx)
Configure o Nginx para apontar para a porta 3000 e gerenciar o certificado SSL (HTTPS).

```nginx
server {
    listen 80;
    server_name seu-dominio.com.br;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 6. Backups
O banco de dados é o arquivo `prisma/dev.db`. Recomendamos rotinas de backup diário deste arquivo.
