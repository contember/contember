import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { uic } from '../utils'
import { createComponentOpenHooks } from '../utils/createComponentOpenHooks'

export const { Component: Select, useOpen: useSelectOpenState } = createComponentOpenHooks(SelectPrimitive.Root)

export const SelectGroup = SelectPrimitive.Group

export const SelectValue = SelectPrimitive.Value

export const SelectTrigger = uic(SelectPrimitive.Trigger, {
	baseClass:
		'flex gap-1 h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
	afterChildren: (
		<SelectPrimitive.Icon asChild>
			<ChevronDown className="h-4 w-4 opacity-50" />
		</SelectPrimitive.Icon>
	),
	displayName: SelectPrimitive.Trigger.displayName,
})

export const SelectScrollUpButton = uic(SelectPrimitive.ScrollUpButton, {
	baseClass: 'flex cursor-default items-center justify-center py-1',
	beforeChildren: <ChevronUp className="h-4 w-4" />,
	displayName: SelectPrimitive.ScrollUpButton.displayName,
})

export const SelectScrollDownButton = uic(SelectPrimitive.ScrollDownButton, {
	baseClass: 'flex cursor-default items-center justify-center py-1',
	beforeChildren: <ChevronDown className="h-4 w-4" />,
	displayName: SelectPrimitive.ScrollDownButton.displayName,
})

export const SelectContent = uic(SelectPrimitive.Content, {
	baseClass:
		'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
	displayName: SelectPrimitive.Content.displayName,
	variants: {
		position: {
			popper:
				'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
		},
	},
	defaultVariants: {
		position: 'popper',
	},
	wrapInner: ({ children }) => (
		<>
			<SelectScrollUpButton />
			<SelectPrimitive.Viewport className="p-1 h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]">
				{children}
			</SelectPrimitive.Viewport>
			<SelectScrollDownButton />
		</>
	),
})

export const SelectLabel = uic(SelectPrimitive.Label, {
	baseClass: 'py-1.5 pl-8 pr-2 text-sm font-semibold',
	displayName: SelectPrimitive.Label.displayName,
})

export const SelectItem = uic(SelectPrimitive.Item, {
	baseClass:
		'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
	beforeChildren: (
		<span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
			<SelectPrimitive.ItemIndicator>
				<Check className="h-4 w-4" />
			</SelectPrimitive.ItemIndicator>
		</span>
	),
	displayName: SelectPrimitive.Item.displayName,
})

export const SelectSeparator = uic(SelectPrimitive.Separator, {
	baseClass: '-mx-1 my-1 h-px bg-muted',
	displayName: SelectPrimitive.Separator.displayName,
})
