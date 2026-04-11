
const keywords = ['tag', 'cod', 'identif', 'tipo', 'equip', 'local', 'setor', 'andar', 'pav', 'period', 'modelo', 'marca'];

function findHeader(rows: any[][]) {
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i];
    if (!row || !Array.isArray(row)) continue;
    const matches = row.filter(cell => 
      cell && typeof cell === 'string' && 
      keywords.some(kw => cell.toLowerCase().includes(kw))
    ).length;
    if (matches >= 2) {
      headerRowIndex = i;
      break;
    }
  }
  return headerRowIndex;
}

const mockRows = [
  ["Verbenna Farmácia - Equipamentos de Climatização"], // Row 0: Title
  ["Item", "TAG", "Andar", "Tipo", "Marca", "Modelo Evaporadora"], // Row 1: Headers
  [1, "SPT-TER-01", "TER", "Split High Wall", "Springer Midea", "42AGVCC12M3"] // Row 2: Data
];

const index = findHeader(mockRows);
console.log("Header Row Index Encontrado:", index);
if (index === 1) {
  console.log("✅ SUCESSO: O sistema encontrou o cabeçalho na linha correta!");
} else {
  console.log("❌ ERRO: O sistema não encontrou o cabeçalho na linha 1.");
}
