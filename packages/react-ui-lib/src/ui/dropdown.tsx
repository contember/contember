import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { Check, ChevronRight, Circle, MoreHorizontalIcon } from 'lucide-react'
import * as React from 'react'
import { ReactNode } from 'react'
import { uic } from '../utils'
import { createComponentOpenHooks } from '../utils/createComponentOpenHooks'
import { buttonConfig } from './button'

export const {
	Component: DropdownMenu,
	useOpen: useDropdownMenuOpenState,
} = createComponentOpenHooks(DropdownMenuPrimitive.Root)

export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

export const DropdownMenuGroup = DropdownMenuPrimitive.Group

export const DropdownMenuPortal = DropdownMenuPrimitive.Portal

export const DropdownMenuSub = DropdownMenuPrimitive.Sub

export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup


export const DropdownMenuSubTrigger = uic(DropdownMenuPrimitive.SubTrigger, {
	baseClass: 'flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent',
	beforeChildren: (
		<ChevronRight className="ml-auto h-4 w-4" />
	),
	displayName: 'DropdownMenuSubTrigger',
})

export const DropdownMenuSubContent = uic(DropdownMenuPrimitive.SubContent, {
	baseClass: 'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
	displayName: 'DropdownMenuSubContent',
})

export const DropdownMenuContent = uic(DropdownMenuPrimitive.DropdownMenuContent, {
	wrapOuter: ({ children }) => <DropdownMenuPrimitive.Portal>{children}</DropdownMenuPrimitive.Portal>,
	baseClass: 'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
	displayName: 'DropdownMenuContent',
})

export const DropdownMenuItem = uic(DropdownMenuPrimitive.Item, {
	baseClass: 'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
	displayName: 'DropdownMenuItem',
})

export const DropdownMenuCheckboxItem = uic(DropdownMenuPrimitive.CheckboxItem, {
	baseClass: 'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
	beforeChildren: (
		<span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
			<DropdownMenuPrimitive.ItemIndicator>
				<Check className="h-4 w-4" />
			</DropdownMenuPrimitive.ItemIndicator>
		</span>
	),
	displayName: 'DropdownMenuCheckboxItem',
})

export const DropdownMenuRadioItem = uic(DropdownMenuPrimitive.RadioItem, {
	baseClass: 'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
	beforeChildren: (
		<span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
			<DropdownMenuPrimitive.ItemIndicator>
				<Circle className="h-2 w-2 fill-current" />
			</DropdownMenuPrimitive.ItemIndicator>
		</span>
	),
	displayName: 'DropdownMenuRadioItem',
})


export const DropdownMenuLabel = uic(DropdownMenuPrimitive.Label, {
	baseClass: 'px-2 py-1.5 text-sm font-semibold',
	displayName: 'DropdownMenuLabel',
})

export const DropdownMenuSeparator = uic(DropdownMenuPrimitive.Separator, {
	baseClass: '-mx-1 my-1 h-px bg-muted',
	displayName: 'DropdownMenuSeparator',
})

export const DropdownMenuShortcut = uic('span', {
	baseClass: 'ml-auto text-xs tracking-widest opacity-60',
	displayName: 'DropdownMenuShortcut',
})

export const DropDownTriggerButton = uic('button', {
	...buttonConfig,
	baseClass: [buttonConfig.baseClass, 'flex h-8 w-8 p-0 data-[state=open]:bg-muted'],
	defaultVariants: {
		variant: 'ghost',
	},
	displayName: 'DropDownTriggerButton',
	beforeChildren: <>
		<MoreHorizontalIcon className="h-4 w-4" />
		<span className="sr-only">Open menu</span>
	</>,
})

export const DefaultDropdown = ({ children }: { children: ReactNode }) => (
	<DropdownMenu>
		<DropdownMenuTrigger asChild>
			<DropDownTriggerButton />
		</DropdownMenuTrigger>
		<DropdownMenuContent className="w-[160px]">
			{children}
		</DropdownMenuContent>
	</DropdownMenu>
)
