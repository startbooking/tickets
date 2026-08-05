import { useState, useMemo, useCallback } from 'react';

export interface PaginationResult<T> {
  currentPage: number;
  totalPages: number;
  paginatedItems: T[];
  pageSize: number;
  setPageSize: (size: number) => void;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  goToFirst: () => void;
  goToLast: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  totalItems: number;
}

/**
 * Hook genérico de paginación para listas paginadas en el frontend.
 * @param items - Lista completa de elementos
 * @param initialPageSize - Elementos por página por defecto (default 5)
 */
export function usePagination<T>(items: T[], initialPageSize = 5): PaginationResult<T> {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  const goToPage = useCallback(
    (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages))),
    [totalPages]
  );

  const setPageSize = (size: number) => {
    setPageSizeState(size);
    setCurrentPage(1);
  };

  return {
    currentPage,
    totalPages,
    paginatedItems,
    pageSize,
    setPageSize,
    goToPage,
    nextPage: () => goToPage(currentPage + 1),
    prevPage: () => goToPage(currentPage - 1),
    goToFirst: () => goToPage(1),
    goToLast: () => goToPage(totalPages),
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
    totalItems,
  };
}