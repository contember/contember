import * as React from 'react'
import { ReactElement, ReactNode } from 'react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogTrigger } from '../ui/dialog'
import { Button } from '../ui/button'
import { SelectItemTrigger, SelectNewItem } from '@contember/react-select'
import { dict } from '../../../lib/dict'


export const CreateEntityDialog = ({ trigger, children }: { trigger: ReactElement, children: ReactNode }) => {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				{trigger}
			</AlertDialogTrigger>
			<AlertDialogContent>
				<SelectNewItem>
					{children}
					<AlertDialogFooter>
						<AlertDialogCancel>{dict.select.cancelNew}</AlertDialogCancel>
						<AlertDialogAction asChild>
							<SelectItemTrigger>
								<Button>{dict.select.confirmNew}</Button>
							</SelectItemTrigger>
						</AlertDialogAction>
					</AlertDialogFooter>

				</SelectNewItem>
			</AlertDialogContent>
		</AlertDialog>
	)
}

