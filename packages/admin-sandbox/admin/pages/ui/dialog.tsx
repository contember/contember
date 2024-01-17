import * as React from 'react'
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'
import { cn } from './cn'
import { UIC } from './uiel'
import { Button } from './button'


export const AlertDialog = AlertDialogPrimitive.Root

export const AlertDialogTrigger = AlertDialogPrimitive.Trigger

export const AlertDialogPortal = AlertDialogPrimitive.Portal

export const AlertDialogOverlay = UIC(AlertDialogPrimitive.Overlay, {
	baseClass: 'fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
	displayName: 'AlertDialogOverlay',
})

export const AlertDialogContent = UIC(AlertDialogPrimitive.Content, {
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

export const AlertDialogHeader = UIC('div', {
	baseClass: 'flex flex-col space-y-2 text-center sm:text-left',
	displayName: 'AlertDialogHeader',
})

export const AlertDialogFooter = UIC('div', {
	baseClass: 'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
	displayName: 'AlertDialogFooter',
})

export const AlertDialogTitle = UIC(AlertDialogPrimitive.Title, {
	baseClass: 'text-lg font-semibold',
	displayName: 'AlertDialogTitle',
})


export const AlertDialogDescription = UIC(AlertDialogPrimitive.Description, {
	baseClass: 'text-sm text-muted-foreground',
	displayName: 'AlertDialogDescription',
})

export const AlertDialogAction = React.forwardRef<
	React.ElementRef<typeof AlertDialogPrimitive.Action>,
	React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ children, asChild, className, ...props }, ref) => (
	<AlertDialogPrimitive.Action
		ref={ref}
		{...props}
		asChild
	>
		{asChild ? children : <Button className={className}>
			{children}
		</Button>}
	</AlertDialogPrimitive.Action>
))
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

export const AlertDialogCancel = React.forwardRef<
	React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
	React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ children, asChild, className, ...props }, ref) => (
	<AlertDialogPrimitive.Cancel
		ref={ref}
		{...props}
		asChild
	>
		{asChild ? children : <Button className={className} variant={'outline'}>
			{children}
		</Button>}
	</AlertDialogPrimitive.Cancel>
))
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName
