import { Button } from './ui/button';
import { Search, X } from 'lucide-react';

interface PEPSearchProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
}

export function PEPSearch({ 
  searchValue, 
  onSearchChange, 
  onClearSearch 
}: PEPSearchProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold tracking-wider text-gray-500 uppercase">
        Pesquisar PEP
      </h3>
      <div className="relative">
        <Search className="absolute w-4 h-4 text-gray-500 transform -translate-y-1/2 left-3 top-1/2" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Digite o código PEP"
          className="w-full py-2 pl-10 pr-10 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        {searchValue && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSearch}
            className="absolute w-6 h-6 p-0 transform -translate-y-1/2 right-1 top-1/2 hover:bg-gray-100"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
