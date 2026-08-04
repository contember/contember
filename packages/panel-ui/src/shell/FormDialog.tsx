import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@contember/react-ui-lib-base'
import { PlusIcon } from 'lucide-react'
import { type ReactNode, useCallback, useState } from 'react'

export interface FormDialogProps {
	/** Text of the trigger button, which is what the section header shows. */
	label: string
	title: string
	description?: string
	icon?: ReactNode
	/** Secondary when a section offers two ways in, as the members page does. */
	variant?: 'default' | 'outline'
	/** Receives the closer to hand to the form's `onSuccess`. */
	children: (close: () => void) => ReactNode
}

/**
 * A create form behind the section header's button, so a listing page stays one table instead of a
 * table with a form bolted underneath.
 */
export const FormDialog = ({ label, title, description, icon, variant, children }: FormDialogProps) => {
	const [open, setOpen] = useState(false)
	const close = useCallback(() => setOpen(false), [])

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm" variant={variant} className="gap-1.5">
					{icon ?? <PlusIcon className="size-4" />}
					{label}
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-[85vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					{description !== undefined && <DialogDescription>{description}</DialogDescription>}
				</DialogHeader>
				{children(close)}
			</DialogContent>
		</Dialog>
	)
}
