import * as React from 'react'
import * as SheetPrimitive from '@radix-ui/react-dialog'
import { uic } from '../utils/uic'
import { XIcon } from 'lucide-react'
import { createComponentOpenHooks } from '../utils/createComponentOpenHooks'

export const { Component: Sheet, useOpen: useSheetOpenState } = createComponentOpenHooks(SheetPrimitive.Root)

export const SheetTrigger = SheetPrimitive.Trigger

export const SheetClose = SheetPrimitive.Close

export const SheetPortal = SheetPrimitive.Portal

export const SheetOverlay = uic(SheetPrimitive.Overlay, {
	baseClass: 'fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
	displayName: 'SheetOverlay',
})

export const SheetContent = uic(SheetPrimitive.Content, {
	baseClass: 'fixed z-50 gap-4 bg-background p-6 shadow-lg overflow-auto transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500',
	variants: {
		side: {
			top: 'inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
			bottom: 'inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
			left: 'inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm',
			right: 'inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm',
		},
	},
	defaultVariants: {
		side: 'right',
	},
	displayName: 'SheetContent',
	wrapOuter: props => (
		<SheetPortal>
			{/*<SheetOverlay />*/}
			{props.children}
			<SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
				<XIcon className="h-4 w-4" />
				<span className="sr-only">Close</span>
			</SheetPrimitive.Close>
		</SheetPortal>
	),
})


export const SheetHeader = uic('div', {
	baseClass: 'flex flex-col space-y-2 text-center sm:text-left',
	displayName: 'SheetHeader',
})


export const SheetFooter = uic('div', {
	baseClass: 'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
	displayName: 'SheetFooter',
})

export const SheetTitle = uic(SheetPrimitive.Title, {
	baseClass: 'text-lg font-semibold text-foreground',
	displayName: 'SheetTitle',
})

export const SheetDescription = uic(SheetPrimitive.Description, {
	baseClass: 'text-sm text-muted-foreground',
	displayName: 'SheetDescription',
})
