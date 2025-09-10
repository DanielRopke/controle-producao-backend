import { CalendarDays } from 'lucide-react';

interface DateRangeFilterProps {
  startDate?: Date;
  endDate?: Date;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
}

// Formata uma Date para YYYY-MM-DD no fuso local (para usar em inputs type=date)
const formatLocalYMD = (d?: Date) => {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Cria uma Date representando meia-noite no fuso local a partir da string YYYY-MM-DD
const parseLocalYMD = (s: string) => {
  // usar o formato 'YYYY-MM-DDTHH:mm' (sem timezone) faz o parser criar a Date no fuso local
  return new Date(`${s}T00:00`);
};

export function DateRangeFilter({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange 
}: DateRangeFilterProps) {

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold tracking-wider text-gray-500 uppercase">
        Filtro de Data
      </h3>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-gray-500" />
          <input
            type="date"
            value={formatLocalYMD(startDate)}
            onChange={(e) => onStartDateChange(e.target.value ? parseLocalYMD(e.target.value) : undefined)}
            className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Data início"
          />
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-gray-500" />
          <input
            type="date"
            value={formatLocalYMD(endDate)}
            onChange={(e) => onEndDateChange(e.target.value ? parseLocalYMD(e.target.value) : undefined)}
            className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Data fim"
          />
        </div>
      </div>
    </div>
  );
}
