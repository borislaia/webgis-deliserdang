'use client'

/**
 * Props untuk Pagination component
 */
interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showInfo?: boolean
  maxVisiblePages?: number
}

/**
 * Pagination component untuk navigasi halaman.
 * 
 * Menampilkan tombol navigasi dengan ellipsis untuk halaman yang banyak.
 * Mendukung keyboard navigation dan accessibility.
 * 
 * @param currentPage - Halaman saat ini (1-indexed)
 * @param totalPages - Total jumlah halaman
 * @param onPageChange - Callback ketika halaman berubah, menerima page number baru
 * @param showInfo - Tampilkan info "Halaman X dari Y" (default: true)
 * @param maxVisiblePages - Maksimal jumlah tombol halaman yang terlihat (default: 5)
 * 
 * @example
 * ```tsx
 * <Pagination
 *   currentPage={1}
 *   totalPages={10}
 *   onPageChange={(page) => setPage(page)}
 * />
 * ```
 */
export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showInfo = true,
  maxVisiblePages = 5,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const getVisiblePages = () => {
    const pages: (number | string)[] = []
    const half = Math.floor(maxVisiblePages / 2)

    let start = Math.max(1, currentPage - half)
    let end = Math.min(totalPages, start + maxVisiblePages - 1)

    // Adjust start if we're near the end
    if (end - start < maxVisiblePages - 1) {
      start = Math.max(1, end - maxVisiblePages + 1)
    }

    // Add first page and ellipsis
    if (start > 1) {
      pages.push(1)
      if (start > 2) pages.push('...')
    }

    // Add visible pages
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    // Add last page and ellipsis
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('...')
      pages.push(totalPages)
    }

    return pages
  }

  const visiblePages = getVisiblePages()

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 }}>
      {showInfo && (
        <span style={{ marginRight: 8, fontSize: 14, color: '#6b7280' }}>
          Halaman {currentPage} dari {totalPages}
        </span>
      )}

      <button
        className="btn"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Halaman sebelumnya"
      >
        ‹ Prev
      </button>

      <div style={{ display: 'flex', gap: 4 }}>
        {visiblePages.map((page, index) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${index}`} style={{ padding: '8px 12px', color: '#9ca3af' }}>
                ...
              </span>
            )
          }

          const pageNum = page as number
          const isActive = pageNum === currentPage

          return (
            <button
              key={pageNum}
              className={isActive ? 'btn primary' : 'btn'}
              onClick={() => onPageChange(pageNum)}
              style={{
                minWidth: 40,
                fontWeight: isActive ? 600 : 400,
              }}
              aria-label={`Halaman ${pageNum}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {pageNum}
            </button>
          )
        })}
      </div>

      <button
        className="btn"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Halaman berikutnya"
      >
        Next ›
      </button>
    </div>
  )
}
