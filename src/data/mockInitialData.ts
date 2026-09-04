import { BrazilianStateRP } from '../types';

export const INITIAL_STATES: BrazilianStateRP[] = [
  // Centro-Oeste
  { uf: 'DF', name: 'Distrito Federal', region: 'Centro-Oeste', capital: 'Brasília' },
  { uf: 'GO', name: 'Goiás', region: 'Centro-Oeste', capital: 'Goiânia' },
  { uf: 'MT', name: 'Mato Grosso', region: 'Centro-Oeste', capital: 'Cuiabá' },
  { uf: 'MS', name: 'Mato Grosso do Sul', region: 'Centro-Oeste', capital: 'Campo Grande' },

  // Sudeste
  { uf: 'SP', name: 'São Paulo', region: 'Sudeste', capital: 'São Paulo' },
  { uf: 'RJ', name: 'Rio de Janeiro', region: 'Sudeste', capital: 'Rio de Janeiro' },
  { uf: 'MG', name: 'Minas Gerais', region: 'Sudeste', capital: 'Belo Horizonte' },
  { uf: 'ES', name: 'Espírito Santo', region: 'Sudeste', capital: 'Vitória' },

  // Sul
  { uf: 'PR', name: 'Paraná', region: 'Sul', capital: 'Curitiba' },
  { uf: 'SC', name: 'Santa Catarina', region: 'Sul', capital: 'Florianópolis' },
  { uf: 'RS', name: 'Rio Grande do Sul', region: 'Sul', capital: 'Porto Alegre' },

  // Nordeste
  { uf: 'BA', name: 'Bahia', region: 'Nordeste', capital: 'Salvador' },
  { uf: 'PE', name: 'Pernambuco', region: 'Nordeste', capital: 'Recife' },
  { uf: 'CE', name: 'Ceará', region: 'Nordeste', capital: 'Fortaleza' },
  { uf: 'MA', name: 'Maranhão', region: 'Nordeste', capital: 'São Luís' },
  { uf: 'PB', name: 'Paraíba', region: 'Nordeste', capital: 'João Pessoa' },
  { uf: 'RN', name: 'Rio Grande do Norte', region: 'Nordeste', capital: 'Natal' },
  { uf: 'AL', name: 'Alagoas', region: 'Nordeste', capital: 'Maceió' },
  { uf: 'PI', name: 'Piauí', region: 'Nordeste', capital: 'Teresina' },
  { uf: 'SE', name: 'Sergipe', region: 'Nordeste', capital: 'Aracaju' },

  // Norte
  { uf: 'AM', name: 'Amazonas', region: 'Norte', capital: 'Manaus' },
  { uf: 'PA', name: 'Pará', region: 'Norte', capital: 'Belém' },
  { uf: 'RO', name: 'Rondônia', region: 'Norte', capital: 'Porto Velho' },
  { uf: 'TO', name: 'Tocantins', region: 'Norte', capital: 'Palmas' },
  { uf: 'AC', name: 'Acre', region: 'Norte', capital: 'Rio Branco' },
  { uf: 'AP', name: 'Amapá', region: 'Norte', capital: 'Macapá' },
  { uf: 'RR', name: 'Roraima', region: 'Norte', capital: 'Boa Vista' }
];
