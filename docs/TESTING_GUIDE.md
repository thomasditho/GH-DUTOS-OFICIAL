# Plano de Testes - GH DUTOS

Para garantir a qualidade do sistema, siga este roteiro de testes antes de cada entrega ou atualização.

## 1. Testes de Acesso
- [ ] Login com Administrador (Acesso total).
- [ ] Login com Operador (Acesso restrito).
- [ ] Tentativa de acesso a rotas protegidas sem token (Deve redirecionar para /login).

## 2. Testes de Inventário
- [ ] Criar um novo ativo manualmente.
- [ ] Editar um ativo existente.
- [ ] Excluir um ativo (Verificar se as manutenções vinculadas também são tratadas).
- [ ] Buscar um ativo pelo código na barra de pesquisa.

## 3. Testes de QR Code
- [ ] Gerar etiqueta PDF e verificar se o QR Code é legível por um celular.
- [ ] Escanear o QR Code e verificar se abre a página pública correta.
- [ ] Verificar se a página pública mostra o histórico de manutenções.

## 4. Testes de Importação (Excel)
- [ ] Importar planilha com 10 ativos.
- [ ] Verificar se colunas extras foram criadas como "Atributos Técnicos".
- [ ] Testar importação com códigos duplicados (O sistema deve avisar o erro).

## 5. Testes de Impressão em Lote
- [ ] Selecionar 15 ativos e gerar PDF.
- [ ] Verificar se o grid 3x5 está alinhado na página A4.
- [ ] Verificar se todos os QR Codes no PDF são diferentes e funcionais.

## 6. Testes de Manutenção
- [ ] Registrar manutenção com anexo PDF.
- [ ] Verificar se o anexo abre corretamente no navegador.
- [ ] Gerar "Relatório de Manutenção (PDF)" e verificar layout e cores.
