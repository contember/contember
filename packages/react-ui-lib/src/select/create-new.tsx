import { ReactElement, ReactNode } from 'react'
import { Button } from '../ui/button'
import { SelectItemTrigger, SelectNewItem } from '@contember/react-select'
import { dict } from '../dict'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger } from '../ui/dialog'

/**
 * Props for {@link CreateEntityDialog} component.
 */
export type CreateEntityDialogProps = {
	/**
	 * Trigger element for the dialog.
	 */
	trigger: ReactElement
	/**
	 * Content to be displayed inside the dialog.
	 */
	children: ReactNode
}

/**
 * Props {@link CreateEntityDialogProps}
 *
 * `CreateEntityDialog` is a modal component that facilitates the creation of a new entity.
 * It integrates entity selection functionality with confirmation and cancellation actions.
 *
 * #### Example: Basic usage
 * ```tsx
 * <CreateEntityDialog
 *   trigger={<Button>Create New Entity</Button>}
 * >
 *   <EntityForm />
 * </CreateEntityDialog>
 * ```
 */
export const CreateEntityDialog = ({ trigger, children }: CreateEntityDialogProps) => (
	<Dialog>
		<DialogTrigger asChild>
			{trigger}
		</DialogTrigger>
		<DialogContent>
			<SelectNewItem>
				{children}
				<DialogFooter>
					<DialogClose asChild>
						<Button variant="outline">{dict.select.cancelNew}</Button>
					</DialogClose>
					<DialogClose asChild>
						<SelectItemTrigger>
							<Button>{dict.select.confirmNew}</Button>
						</SelectItemTrigger>
					</DialogClose>
				</DialogFooter>

			</SelectNewItem>
		</DialogContent>
	</Dialog>
)
