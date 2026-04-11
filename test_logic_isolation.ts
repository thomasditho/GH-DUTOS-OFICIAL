import { nanoid } from 'nanoid';
import * as XLSX from 'xlsx';

async function test() {
  console.log('Testando nanoid:', nanoid(10));
  
  const mapping = {
    codigo: 'TAG',
    tipo: 'Tipo',
    local: 'Local da Evaporadora',
    andar: 'Andar',
    periodicidade: ''
  };

  const row = {
    'TAG': 'SPT-TER-01',
    'Tipo': 'Split High Wall',
    'Local da Evaporadora': 'Recepção',
    'Andar': 'TER',
    'Marca': 'Springer Midea'
  };

  const codigo = row[mapping.codigo as keyof typeof row]?.toString().trim().toUpperCase();
  console.log('Código extraído:', codigo);

  const attributes: any[] = [];
  Object.keys(row).forEach(key => {
    const isMapped = Object.values(mapping).includes(key);
    if (!isMapped && row[key as keyof typeof row] !== undefined) {
      attributes.push({
        key: key.toUpperCase(),
        value: row[key as keyof typeof row].toString().toUpperCase()
      });
    }
  });
  console.log('Atributos:', attributes);
}

test().catch(console.error);
