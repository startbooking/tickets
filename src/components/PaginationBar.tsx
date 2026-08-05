import { useState } from "react";
import { ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  onGoToPage: (page: number) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onGoToFirst: () => void;
  onGoToLast: () => void;
  pageSizeOptions?: number[];
}

const DEFAULT_PAGE_SIZES = [10, 25, 50, 100];
const MAX_VISIBLE_PAGES = 6;

export function PaginationBar({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageSizeChange,
  onGoToPage,
  onPrevPage,
  onNextPage,
  onGoToFirst,
  onGoToLast,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
}: PaginationBarProps) {
  const [targetPage, setTargetPage] = useState<string>(String(currentPage));

  if (totalPages <= 1) return null;

  const desde = (currentPage - 1) * pageSize + 1;
  const hasta = Math.min(currentPage * pageSize, totalItems);

  const handleGoTo = () => {
    const page = Number(targetPage);
    if (!Number.isNaN(page)) onGoToPage(page);
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
      {/* Selector de registros por página */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span>Registros por página:</span>
        <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
          <SelectTrigger className="w-20 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((opt) => (
              <SelectItem key={opt} value={String(opt)}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Controles de navegación */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-slate-400 mr-2">
          {desde}–{hasta} de {totalItems}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={onGoToFirst}
          disabled={currentPage === 1}
          className="px-2"
          title="Primera página"
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onPrevPage}
          disabled={currentPage === 1}
          className="px-2"
          title="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {totalPages <= MAX_VISIBLE_PAGES ? (
          Array.from({ length: totalPages }).map((_, i) => (
            <Button
              key={i}
              variant={currentPage === i + 1 ? "default" : "outline"}
              size="sm"
              onClick={() => onGoToPage(i + 1)}
              className={`w-9 px-0 ${currentPage === i + 1 ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-slate-600'}`}
            >
              {i + 1}
            </Button>
          ))
        ) : (
          <>
            <span className="text-xs text-slate-500 whitespace-nowrap">
              Página:
            </span>
            <Select value={targetPage} onValueChange={setTargetPage}>
              <SelectTrigger className="w-20 h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <SelectItem key={i} value={String(i + 1)}>
                    {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="default"
              size="sm"
              onClick={handleGoTo}
              className="h-9 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Ir
            </Button>
          </>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={onNextPage}
          disabled={currentPage === totalPages}
          className="px-2"
          title="Página siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onGoToLast}
          disabled={currentPage === totalPages}
          className="px-2"
          title="Última página"
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}