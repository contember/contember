import * as SeparatorPrimitive from '@radix-ui/react-separator'
import { uic } from '../utils'

export const Separator = uic(SeparatorPrimitive.Root, {
	baseClass: 'shrink-0 bg-border',
	variants: {
		orientation: {
			horizontal: 'h-[1px] w-full',
			vertical: 'h-full w-[1px]',
		},
	},
	displayName: SeparatorPrimitive.Root.displayName,
})
