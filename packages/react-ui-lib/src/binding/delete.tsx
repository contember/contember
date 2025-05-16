import { DeleteEntityTrigger, type RoutingLinkTarget, useRedirect } from '@contember/interface'
import type { FC, ReactElement } from 'react'
import * as React from 'react'
import { dict } from '../dict'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '../ui/alert-dialog'
import { Button } from '../ui/button'

/**
 * Props for {@link DeleteEntityDialog} component.
 */
export type DeleteEntityDialogProps = {
	/** Element that opens the dialog */
	trigger: ReactElement
	/** Controls if deletion happens immediately (default: true) */
	immediatePersist?: boolean
	/** Routing target after successful deletion */
	onSuccessRedirectTo?: RoutingLinkTarget
}

/**
 * Props {@link DeleteEntityDialogProps}.
 *
 * `DeleteEntityDialog` component - Confirmation dialog for entity deletion
 *
 * Provides a user-friendly confirmation flow before deleting entities while handling persistence and redirects
 *
 * #### Example: Basic usage
 * ```tsx
 * <DeleteEntityDialog
 *   trigger={<Button>Delete User</Button>}
 * />
 * ```
 *
 * #### Example: With delayed persistence
 * ```tsx
 * <DeleteEntityDialog
 *   immediatePersist={false}
 *   trigger={<Button>Mark for Deletion</Button>}
 * />
 * ```
 *
 * #### Example: With redirect
 * ```tsx
 * <DeleteEntityDialog
 *   onSuccessRedirectTo="users"
 *   trigger={<Button variant="destructive">Delete</Button>}
 * />
 * ```
 */
export const DeleteEntityDialog: FC<DeleteEntityDialogProps> = ({ trigger, immediatePersist, onSuccessRedirectTo }) => {
	const redirect = useRedirect()
	const handlePersistSuccess = onSuccessRedirectTo ? () => redirect(onSuccessRedirectTo) : undefined

	return (
		<>
			<AlertDialog>
				<AlertDialogTrigger asChild>
					{trigger}
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{dict.deleteEntityDialog.title}</AlertDialogTitle>
						<AlertDialogDescription>{dict.deleteEntityDialog.description}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{dict.deleteEntityDialog.cancelButton}</AlertDialogCancel>
						<DeleteEntityTrigger
							immediatePersist={immediatePersist ?? true}
							onPersistSuccess={handlePersistSuccess}
						>
							<AlertDialogAction asChild>
								<Button variant={'destructive'}>{dict.deleteEntityDialog.confirmButton}</Button>
							</AlertDialogAction>
						</DeleteEntityTrigger>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
