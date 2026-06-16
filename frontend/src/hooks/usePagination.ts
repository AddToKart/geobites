import { useCallback, useEffect, useMemo, useRef, useState } from "react"

function getVisiblePages(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | "ellipsis")[] = [1]

  if (current > 3) {
    pages.push("ellipsis")
  }

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (current < total - 2) {
    pages.push("ellipsis")
  }

  if (total > 1) {
    pages.push(total)
  }

  return pages
}

export function usePagination<T>(items: T[], pageSize: number) {
  const [currentPage, setCurrentPage] = useState(1)
  const prevLength = useRef(items.length)

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(items.length / pageSize)),
    [items.length, pageSize],
  )

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  useEffect(() => {
    if (items.length !== prevLength.current) {
      prevLength.current = items.length
      setCurrentPage(1)
    }
  }, [items.length])

  const paginatedItems = useMemo(
    () => items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [items, currentPage, pageSize],
  )

  const goNext = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }, [totalPages])

  const goPrev = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }, [])

  const goTo = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)))
    },
    [totalPages],
  )

  const visiblePages = useMemo(
    () => getVisiblePages(currentPage, totalPages),
    [currentPage, totalPages],
  )

  return {
    currentPage,
    totalPages,
    paginatedItems,
    goNext,
    goPrev,
    goTo,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages,
    startIndex: (currentPage - 1) * pageSize + 1,
    endIndex: Math.min(currentPage * pageSize, items.length),
    visiblePages,
  }
}
