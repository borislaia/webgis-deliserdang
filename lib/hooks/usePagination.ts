import { useState, useMemo } from 'react'

/**
 * Custom hook untuk pagination
 * 
 * @param items - Array of items untuk di-paginate
 * @param itemsPerPage - Jumlah items per halaman (default: 20)
 * @returns Object dengan pagination state dan functions
 * 
 * @example
 * ```tsx
 * const { currentItems, currentPage, totalPages, goToPage, nextPage, prevPage } = usePagination(data, 20)
 * ```
 */
export function usePagination<T>(items: T[], itemsPerPage: number = 20) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(items.length / itemsPerPage))
  }, [items.length, itemsPerPage])

  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return items.slice(startIndex, endIndex)
  }, [items, currentPage, itemsPerPage])

  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages))
    setCurrentPage(validPage)
  }

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1)
    }
  }

  const reset = () => {
    setCurrentPage(1)
  }

  return {
    currentItems,
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems: items.length,
    goToPage,
    nextPage,
    prevPage,
    reset,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  }
}
