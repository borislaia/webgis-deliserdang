import { renderHook, act } from '@testing-library/react'
import { usePagination } from '../usePagination'

describe('usePagination', () => {
  const mockItems = Array.from({ length: 50 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }))

  it('should initialize with first page', () => {
    const { result } = renderHook(() => usePagination(mockItems, 10))
    
    expect(result.current.currentPage).toBe(1)
    expect(result.current.currentItems).toHaveLength(10)
    expect(result.current.currentItems[0].id).toBe(1)
  })

  it('should calculate total pages correctly', () => {
    const { result } = renderHook(() => usePagination(mockItems, 10))
    
    expect(result.current.totalPages).toBe(5)
    expect(result.current.totalItems).toBe(50)
  })

  it('should navigate to next page', () => {
    const { result } = renderHook(() => usePagination(mockItems, 10))
    
    act(() => {
      result.current.nextPage()
    })
    
    expect(result.current.currentPage).toBe(2)
    expect(result.current.currentItems[0].id).toBe(11)
  })

  it('should navigate to previous page', () => {
    const { result } = renderHook(() => usePagination(mockItems, 10))
    
    act(() => {
      result.current.nextPage()
      result.current.prevPage()
    })
    
    expect(result.current.currentPage).toBe(1)
    expect(result.current.currentItems[0].id).toBe(1)
  })

  it('should go to specific page', () => {
    const { result } = renderHook(() => usePagination(mockItems, 10))
    
    act(() => {
      result.current.goToPage(3)
    })
    
    expect(result.current.currentPage).toBe(3)
    expect(result.current.currentItems[0].id).toBe(21)
  })

  it('should not go beyond total pages', () => {
    const { result } = renderHook(() => usePagination(mockItems, 10))
    
    act(() => {
      result.current.goToPage(100)
    })
    
    expect(result.current.currentPage).toBe(5) // max pages
  })

  it('should not go below page 1', () => {
    const { result } = renderHook(() => usePagination(mockItems, 10))
    
    act(() => {
      result.current.goToPage(0)
    })
    
    expect(result.current.currentPage).toBe(1)
  })

  it('should reset to first page', () => {
    const { result } = renderHook(() => usePagination(mockItems, 10))
    
    act(() => {
      result.current.goToPage(3)
      result.current.reset()
    })
    
    expect(result.current.currentPage).toBe(1)
  })

  it('should handle empty array', () => {
    const { result } = renderHook(() => usePagination([], 10))
    
    expect(result.current.totalPages).toBe(1)
    expect(result.current.currentItems).toHaveLength(0)
    expect(result.current.hasNextPage).toBe(false)
    expect(result.current.hasPrevPage).toBe(false)
  })

  it('should handle items less than itemsPerPage', () => {
    const { result } = renderHook(() => usePagination([1, 2, 3], 10))
    
    expect(result.current.totalPages).toBe(1)
    expect(result.current.currentItems).toHaveLength(3)
  })

  it('should update when items change', () => {
    const { result, rerender } = renderHook(
      ({ items }) => usePagination(items, 10),
      { initialProps: { items: mockItems.slice(0, 20) } }
    )
    
    expect(result.current.totalPages).toBe(2)
    
    rerender({ items: mockItems.slice(0, 30) })
    
    expect(result.current.totalPages).toBe(3)
  })
})
