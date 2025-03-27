import { uic, uiconfig } from '../utils'

export const buttonConfig = uiconfig({
	baseClass: 'inline-flex items-center justify-center rounded-md text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 transition-all',
	variants: {
		variant: {
			default: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
			destructive: 'bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90',
			outline: 'border border-input bg-background-upper shadow-xs hover:bg-accent hover:text-accent-foreground',
			secondary: 'bg-secondary border border-input text-secondary-foreground shadow-xs hover:bg-secondary/80',
			ghost: 'hover:bg-accent hover:text-accent-foreground',
			link: 'text-primary underline-offset-4 hover:underline',
		},
		size: {
			default: 'h-9 px-4 py-2',
			xs: 'h-6 rounded-sm px-2 text-xs',
			sm: 'h-8 rounded-md px-3 text-xs',
			lg: 'h-10 rounded-md px-8',
			icon: 'h-9 w-9',
		},
	},
	defaultVariants: {
		variant: 'default',
		size: 'default',
	},
})

export const Button = uic('button', buttonConfig)
export const AnchorButton = uic('a', buttonConfig)
