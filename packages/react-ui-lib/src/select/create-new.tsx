import * as React from 'react'
import { ReactElement, ReactNode } from 'react'
import { Button } from '@contember/react-ui-lib-base'
import { SelectItemTrigger, SelectNewItem } from '@contember/react-select'
import { dict } from '@contember/react-ui-lib-base'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger } from '@contember/react-ui-lib-base'

export const CreateEntityDialog = ({ trigger, children }: { trigger: ReactElement; children: ReactNode }) => {
	return (
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
}
