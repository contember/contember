import * as PopoverPrimitive from '@radix-ui/react-popover'
import { uic } from '../utils'
import { createComponentOpenHooks } from '../utils/createComponentOpenHooks'

const { Component, useOpen } = createComponentOpenHooks(PopoverPrimitive.Root)

export const Popover = Component

export const usePopoverOpenState = useOpen

export const PopoverTrigger = PopoverPrimitive.Trigger

export const PopoverAnchor = PopoverPrimitive.Anchor

export const PopoverContent = uic(PopoverPrimitive.Content, {
	baseClass: [
		'z-50 min-w-40 rounded-md border border-gray-200 bg-popover p-4 text-popover-foreground shadow-md outline-hidden',
		'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
	],
	defaultProps: {
		align: 'center',
		sideOffset: 4,
	},
	wrapOuter: ({ children }) => <PopoverPrimitive.Portal>{children}</PopoverPrimitive.Portal>,
	displayName: PopoverPrimitive.Content.displayName,
})
