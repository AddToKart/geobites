import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import * as React from "react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function Pagination({
  className,
  ...props
}: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  )
}

function PaginationItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="pagination-item"
      className={cn("", className)}
      {...props}
    />
  )
}

type PaginationLinkProps = {
  isActive?: boolean
  disabled?: boolean
} & React.ComponentProps<"button">

function PaginationLink({
  className,
  isActive,
  disabled,
  children,
  ...props
}: PaginationLinkProps) {
  return (
    <button
      data-slot="pagination-link"
      data-active={isActive}
      disabled={disabled}
      className={cn(
        buttonVariants({
          variant: isActive ? "default" : "ghost",
          size: "icon-sm",
        }),
        "rounded-xl text-xs font-bold",
        isActive && "pointer-events-none",
        disabled && "pointer-events-none opacity-30",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

function PaginationPrevious({
  className,
  disabled,
  ...props
}: React.ComponentProps<"button"> & { disabled?: boolean }) {
  return (
    <button
      data-slot="pagination-previous"
      disabled={disabled}
      className={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        "gap-1 pl-2.5 rounded-xl text-xs font-bold",
        disabled && "pointer-events-none opacity-30",
        className,
      )}
      {...props}
    >
      <ChevronLeft className="size-4" />
      <span>Prev</span>
    </button>
  )
}

function PaginationNext({
  className,
  disabled,
  ...props
}: React.ComponentProps<"button"> & { disabled?: boolean }) {
  return (
    <button
      data-slot="pagination-next"
      disabled={disabled}
      className={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        "gap-1 pr-2.5 rounded-xl text-xs font-bold",
        disabled && "pointer-events-none opacity-30",
        className,
      )}
      {...props}
    >
      <span>Next</span>
      <ChevronRight className="size-4" />
    </button>
  )
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="pagination-ellipsis"
      aria-hidden
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
}
