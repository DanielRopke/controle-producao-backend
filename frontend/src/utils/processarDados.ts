
export function processarDados(
  dados: Array<{ status: string; count: number; seccional?: string }>,
  ignorarFechada = false,
  filtros?: { seccionais?: string[] }
) {
  return Object.entries(
    dados.filter(item => {
      // Se não há filtro de seccional, ou o item tem seccional e está no filtro, ou o item não tem seccional (considera para todos)
      const matchSeccional =
        !filtros?.seccionais?.length ||
        (item.seccional && filtros.seccionais.includes(item.seccional)) ||
        (!item.seccional && filtros?.seccionais?.length);
      const matchStatus = ignorarFechada ? !["fechado", "fechada"].includes(item.status.toLowerCase()) : true;
      // Se há filtro de seccional, só inclui itens sem seccional se for para todos
      if (filtros?.seccionais?.length && !item.seccional) {
        return matchStatus;
      }
      return matchSeccional && matchStatus;
    }).reduce((acc: Record<string, number>, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + curr.count;
      return acc;
    }, {})
  ).map(([status, count]) => ({ status, count }));
}
