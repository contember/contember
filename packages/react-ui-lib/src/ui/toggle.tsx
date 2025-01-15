import * as TogglePrimitive from '@radix-ui/react-toggle'
import { ConfigVariants, uic, uiconfig } from '../utils'

export const toggleConfig = uiconfig({
	baseClass: 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent data-[active]:shadow-inner data-[active]:text-accent-foreground',
	variants: {
		variant: {
			default: 'bg-transparent',
			outline:
				'border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground',
		},
		size: {
			default: 'h-8 px-3',
			sm: 'h-8 px-2',
			lg: 'h-10 px-3',
		},
	},
	defaultVariants: {
		variant: 'default',
		size: 'default',
	},
})

export type ToggleProps = ConfigVariants<Exclude<typeof toggleConfig.variants, undefined>>


export const Toggle = uic(TogglePrimitive.Root, toggleConfig)

