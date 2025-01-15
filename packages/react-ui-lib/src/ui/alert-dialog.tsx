import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'
import * as React from 'react'
import { uic } from '../utils'
import { createComponentOpenHooks } from '../utils/createComponentOpenHooks'
import { buttonConfig } from './button'

export const {
	Component: AlertDialog,
	useOpen: useAlertDialogOpenState,
} = createComponentOpenHooks(AlertDialogPrimitive.Root)

export const AlertDialogTrigger = AlertDialogPrimitive.Trigger

export const AlertDialogPortal = AlertDialogPrimitive.Portal

export const AlertDialogOverlay = uic(AlertDialogPrimitive.Overlay, {
	baseClass: 'fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
	displayName: 'AlertDialogOverlay',
})

export const AlertDialogContent = uic(AlertDialogPrimitive.Content, {
	baseClass: 'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
	wrapOuter: props => {
		return (
			<AlertDialogPortal>
				<AlertDialogOverlay />
				{props.children}
			</AlertDialogPortal>
		)
	},
	displayName: 'AlertDialogContent',
})

export const AlertDialogHeader = uic('div', {
	baseClass: 'flex flex-col space-y-2 text-center sm:text-left',
	displayName: 'AlertDialogHeader',
})

export const AlertDialogFooter = uic('div', {
	baseClass: 'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
	displayName: 'AlertDialogFooter',
})

export const AlertDialogTitle = uic(AlertDialogPrimitive.Title, {
	baseClass: 'text-lg font-semibold',
	displayName: 'AlertDialogTitle',
})


export const AlertDialogDescription = uic(AlertDialogPrimitive.Description, {
	baseClass: 'text-sm text-muted-foreground',
	displayName: 'AlertDialogDescription',
})

export const AlertDialogAction = uic(AlertDialogPrimitive.Action, buttonConfig)
export const AlertDialogCancel = uic(AlertDialogPrimitive.Cancel, {
	...buttonConfig,
	defaultVariants: {
		variant: 'outline',
		size: 'default',
	},
})
