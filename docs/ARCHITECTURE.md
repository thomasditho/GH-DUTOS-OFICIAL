# Arquitetura do Sistema - GH DUTOS

Este documento descreve a estrutura técnica e as decisões de design do sistema de Gestão de Ativos.

## 1. Visão Geral
O sistema segue uma arquitetura **SPA (Single Page Application)** com um backend integrado servindo uma **API RESTful**.

## 2. Stack Tecnológica
- **Frontend:** React 19 com Vite para build rápido.
- **Estilização:** Tailwind CSS (Utility-first CSS).
- **Gerenciamento de Estado:** React Hooks (useState, useEffect, useContext).
- **Roteamento:** React Router DOM v7.
- **Backend:** Node.js com Express.
- **ORM:** Prisma (Type-safe database access).
- **Banco de Dados:** SQLite (Desenvolvimento/Produção Leve).

## 3. Fluxo de Dados
1. O usuário interage com a interface React.
2. O Frontend faz requisições HTTP para o servidor Express (`/api/*`).
3. O servidor valida a autenticação via **JWT (JSON Web Token)**.
4. O Prisma ORM processa as operações no banco de dados SQLite.
5. A resposta é retornada em formato JSON para o Frontend.

## 4. Organização de Pastas
- `src/components`: Componentes reutilizáveis (Botões, Layout, Modais).
- `src/pages`: Telas principais do sistema.
- `src/contexts`: Provedores de contexto (Autenticação).
- `src/services`: Lógica de comunicação com a API.
- `src/lib`: Utilitários e configurações de bibliotecas (Impressão, Tailwind).

## 5. Segurança
- Senhas criptografadas com **bcryptjs**.
- Rotas protegidas por Middleware de autenticação no Backend.
- Token JWT armazenado no `localStorage` para persistência de sessão.
