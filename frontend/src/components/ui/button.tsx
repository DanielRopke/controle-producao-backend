import * as React from 'react'
import { cn } from '../../lib/utils'

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: 'default' | 'outline' | 'ghost'
	size?: 'sm' | 'md' | 'lg' | 'icon'
}

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
	default: 'bg-green-600 text-white hover:bg-green-700 border border-green-600',
	outline: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
	ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
}

const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
	sm: 'h-9 px-3 py-2 text-sm rounded-xl',
	md: 'h-10 px-4 py-2 text-sm rounded-xl',
	lg: 'h-11 px-5 py-3 text-base rounded-xl',
	icon: 'h-9 w-9 p-0 rounded-xl',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant = 'default', size = 'md', ...props }, ref) => (
		<button
			ref={ref}
			className={cn(
				'inline-flex items-center justify-center font-medium transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed',
				variants[variant],
				sizes[size],
				className,
			)}
			{...props}
		/>
	),
)
Button.displayName = 'Button'

export default Button
