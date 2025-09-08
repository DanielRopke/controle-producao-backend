export type GraficoItem = {
  status: string;
  seccional: string;
  count: number;
};

export type ServicoItem = {
  status: string;
  seccional: string;
  count: number;
};

export type SeccionalData = {
  seccional: string;
  totalRS: number;
  totalPEP: number;
  scaledPEP: number;
  mes: string;
  statusSap?: string;
  tipo?: string;
};

export type MatrizItem = {
  pep: string;
  prazo: string;
  dataConclusao: string;
  statusSap: string;
  valor: string | number;
  seccional: string;
  tipo: string;
};
