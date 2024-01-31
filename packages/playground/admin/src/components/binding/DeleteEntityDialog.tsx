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
import { FeedbackTrigger } from './FeedbackTrigger'

export const DeleteEntityDialog = ({ trigger }: { trigger: ReactElement }) => {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				{trigger}
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
					<AlertDialogDescription>
						This action cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<FeedbackTrigger>
						<DeleteEntityTrigger immediatePersist>
							<AlertDialogAction asChild>
								<Button variant={'destructive'}>Confirm</Button>
							</AlertDialogAction>
						</DeleteEntityTrigger>
					</FeedbackTrigger>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
