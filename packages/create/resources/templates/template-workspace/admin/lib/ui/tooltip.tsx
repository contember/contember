import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { uic } from '../utils'


export const TooltipProvider = TooltipPrimitive.Provider

export const Tooltip = TooltipPrimitive.Root

export const TooltipTrigger = TooltipPrimitive.Trigger

export const TooltipContent = uic(TooltipPrimitive.Content, {
	baseClass: 'z-50 overflow-hidden p-2 text-sm text-popover-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
	variants: {
		variant: {
			default: 'rounded-md border bg-popover shadow-md',
			blurred: 'rounded-md backdrop-blur shadow-md border',
			seamless: '',
		},
	},
	defaultVariants: {
		variant: 'default',
	},
	displayName: 'TooltipContent',
})
