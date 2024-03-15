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
} from '../ui/dialog'
import { Button } from '../ui/button'
import * as React from 'react'
import { ReactElement } from 'react'
import { DeleteEntityTrigger } from '@contember/interface'
import { FeedbackTrigger } from './persist'
import { dict } from '../../dict'

export const DeleteEntityDialog = ({ trigger }: { trigger: ReactElement }) => {
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
						<DeleteEntityTrigger immediatePersist>
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
