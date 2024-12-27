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

export type DeleteEntityDialogProps = {
	trigger: ReactElement
	immediatePersist?: boolean
	onSuccessRedirectTo?: RoutingLinkTarget
}

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
