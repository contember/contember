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
import * as React from 'react'
import { ReactElement } from 'react'
import { DeleteEntityTrigger } from '@contember/interface'
import { FeedbackTrigger } from './persist'
import { dict } from '../../dict'

export const DeleteEntityDialog = ({ trigger, immediatePersist }: { trigger: ReactElement, immediatePersist?: boolean }) => {
	return (
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
					<FeedbackTrigger>
						<DeleteEntityTrigger immediatePersist={immediatePersist ?? true}>
							<AlertDialogAction asChild>
								<Button variant={'destructive'}>{dict.deleteEntityDialog.confirmButton}</Button>
							</AlertDialogAction>
						</DeleteEntityTrigger>
					</FeedbackTrigger>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
