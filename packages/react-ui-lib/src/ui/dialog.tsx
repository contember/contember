import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { uic } from '../utils/uic'
import { XIcon } from 'lucide-react'
import { createComponentOpenHooks } from '../utils/createComponentOpenHooks'

export const { Component: Dialog, useOpen: useDialogOpenState } = createComponentOpenHooks(DialogPrimitive.Root)

export const DialogTrigger = DialogPrimitive.Trigger

export const DialogPortal = DialogPrimitive.Portal

export const DialogClose = DialogPrimitive.Close

export const DialogOverlay = uic(DialogPrimitive.DialogOverlay, {
	baseClass: 'fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
	displayName: 'DialogOverlay',
})

export const DialogContent = uic(DialogPrimitive.Content, {
	baseClass: 'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
	wrapOuter: props => (
		<DialogPortal>
			<DialogOverlay />
			{props.children}
		</DialogPortal>
	),
	afterChildren: <>
		<DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
			<XIcon className="h-4 w-4" />
			<span className="sr-only">Close</span>
		</DialogPrimitive.Close>
	</>,
})

export const DialogHeader = uic('div', {
	baseClass: 'flex flex-col space-y-1.5 text-center sm:text-left',
	displayName: 'DialogHeader',
})
export const DialogFooter = uic('div', {
	baseClass: 'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
	displayName: 'DialogFooter',
})
export const DialogTitle = uic(DialogPrimitive.Title, {
	baseClass: 'text-lg font-semibold leading-none tracking-tight',
	displayName: 'DialogTitle',
})

export const DialogDescription = uic(DialogPrimitive.Description, {
	baseClass: 'text-sm text-muted-foreground',
	displayName: 'DialogDescription',
})
