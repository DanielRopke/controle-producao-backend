import * as React from 'react'
import { cn } from '../../lib/utils'

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({ className, ...props }) => (
	<table className={cn('w-full text-sm', className)} {...props} />
)

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, ...props }) => (
	<thead className={cn('', className)} {...props} />
)

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, ...props }) => (
	<tbody className={cn('', className)} {...props} />
)

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ className, ...props }) => (
	<tr className={cn('border-b border-gray-200 last:border-0', className)} {...props} />
)

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ className, ...props }) => (
	<th className={cn('px-4 py-2 text-left font-medium text-gray-700', className)} {...props} />
)

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ className, ...props }) => (
	<td className={cn('px-4 py-2', className)} {...props} />
)

export default Table
