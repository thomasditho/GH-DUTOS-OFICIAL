# Modelo de Banco de Dados - GH DUTOS

O sistema utiliza o Prisma ORM para gerenciar o esquema do banco de dados. Abaixo estão as principais entidades e seus relacionamentos.

## 1. Entidades Principais

### `User`
Armazena os usuários do sistema (Administradores e Operadores).
- `id`: Identificador único.
- `email`: Login de acesso.
- `password`: Hash da senha.
- `role`: Papel no sistema (ADMIN ou OPERATOR).
- `clientId`: Vínculo com uma pasta/cliente específica.

### `Client` (Pastas)
Representa os clientes ou pastas de organização.
- `name`: Nome do cliente.
- `slug`: Identificador amigável para URLs.
- `color`: Cor visual para identificação na interface.

### `Equipment` (Ativos)
O núcleo do sistema.
- `codigo`: TAG ou identificador único do ativo.
- `publicId`: ID aleatório para a URL pública do QR Code.
- `tipo`: Categoria do equipamento (ex: Chiller, Split).
- `local`: Localização física.
- `andar`: Pavimento.
- `status`: Estado atual (OPERACIONAL, MANUTENCAO, CRITICO).
- `periodicidadeManutencao`: Intervalo em dias para alertas.

### `EquipmentAttribute`
Atributos técnicos dinâmicos (importados via Excel ou manuais).
- `key`: Nome do atributo (ex: Marca, Modelo).
- `value`: Valor do atributo.

### `Maintenance`
Histórico de intervenções.
- `data`: Data da realização.
- `descricao`: O que foi feito.
- `responsavel`: Técnico executor.
- `arquivoUrl`: Link para o relatório técnico em PDF.

## 2. Relacionamentos
- Um **Cliente** possui muitos **Equipamentos**.
- Um **Equipamento** possui muitos **Atributos** e muitas **Manutenções**.
- Um **Usuário** pertence a um **Cliente** (escopo de acesso).
