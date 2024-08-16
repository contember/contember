import * as React from 'react'
import { ReactNode } from 'react'
import * as ToastPrimitives from '@radix-ui/react-toast'
import { X } from 'lucide-react'
import { uic } from '../utils'
import { ToasterProvider, useToasts } from './toaster'
import { dict } from '../dict'

export const ToastContent = ({ title, children, action, details }: {
	title?: ReactNode
	children?: ReactNode
	action?: ReactNode
	details?: ReactNode
}) => {
	const [open, setOpen] = React.useState(false)

	return <>
		<div className="flex flex-col gap-1 flex-1 p-6 pr-8">
			{title && <ToastTitle>{title}</ToastTitle>}
			{children && <ToastDescription>{children}</ToastDescription>}
			{details ? (
				open ? (
					<code className="p-1 bg-gray-50 border rounded font-mono text-xs">{details}</code>
				) : (
					<div>
						<button onClick={() => setOpen(true)} className="text-sm text-gray-400 underline">{dict.toast.showDetails}</button>
					</div>
				)
			) : null}
		</div>
		{action}
	</>
}
export const ToastAction = uic(ToastPrimitives.Action, {
	baseClass: 'inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive',
	displayName: 'ToastAction',
})


export const ToastTitle = uic(ToastPrimitives.Title, {
	baseClass: 'text-sm font-semibold',
	displayName: 'ToastTitle',
})

export const ToastDescription = uic(ToastPrimitives.Description, {
	baseClass: 'text-sm opacity-90',
	displayName: 'ToastDescription',
})

export const Toast = uic(ToastPrimitives.Root, {
	baseClass: 'group mt-2 pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-r-md border border-l-4 bg-background text-foreground  shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
	variants: {
		variant: {
			info: 'border-l-blue-500',
			error: 'border-l-destructive',
			warning: 'border-l-orange-500',
			success: 'border-l-green-500',
		},
	},
	defaultVariants: {
		variant: 'info',
	},
	displayName: 'Toast',
	defaultProps: {
		style: {
			userSelect: 'auto',
		},
	},
})

const ToastClose = uic(ToastPrimitives.Close, {
	baseClass: 'absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600',
	displayName: 'ToastClose',
	beforeChildren: <X className="h-4 w-4" />,
})


const ToastViewport = uic(ToastPrimitives.Viewport, {
	baseClass: 'fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]',
	displayName: 'ToastViewport',
})


export function Toaster({ children }: {
	children: ReactNode
}) {
	return (
		<ToasterProvider>
			<ToastPrimitives.Provider duration={Infinity}>
				{children}
				<ToastList />
				<ToastViewport />
			</ToastPrimitives.Provider>
		</ToasterProvider>
	)
}

const ToastList = () => {
	const toasts = useToasts()

	return (
		<>
			{toasts.map(({ id, content, type }) => (
				<Toast key={id} variant={type}>
					{content}
					<ToastClose />
				</Toast>
			))}
		</>
	)
}

