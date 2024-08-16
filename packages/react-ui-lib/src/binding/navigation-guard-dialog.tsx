import { useCallback, useState } from 'react'
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogTitle } from '../ui/alert-dialog'
import { BlockNavigationOnDirtyStateResult, useBlockNavigationOnDirtyState } from '@contember/interface'
import { usePersistFeedbackHandlers } from './hooks'
import { Button } from '../ui/button'
import { SaveIcon } from 'lucide-react'

export const NavigationGuardDialog = () => {
	const [resolver, setResolver] = useState<((value: BlockNavigationOnDirtyStateResult) => void) | null>(null)

	const handler = useCallback(() => new Promise<BlockNavigationOnDirtyStateResult>(resolve => {
		setResolver(() => (value: BlockNavigationOnDirtyStateResult) => {
			setResolver(null)
			resolve(value)
		})
	}), [])

	useBlockNavigationOnDirtyState(handler, usePersistFeedbackHandlers())

	return (
		<AlertDialog open={resolver !== null} onOpenChange={it => it ? null : resolver?.('cancel')}>
			<AlertDialogContent>
				<AlertDialogTitle>Unsaved changes</AlertDialogTitle>
				Do you want to save your changes before leaving?
				<div className="flex gap-2 justify-end">
					<Button onClick={() => resolver?.('save')}>
						<SaveIcon className="w-4 h-4 mr-2" />
						Save
					</Button>
					<Button onClick={() => resolver?.('discard')} variant="outline"
						className="border-destructive/50  text-destructive hover:bg-red-100 hover:text-destructive">
						Don&apos;t save
					</Button>
					<AlertDialogCancel onClick={() => resolver?.('cancel')} className="border-gray-500">Cancel</AlertDialogCancel>
				</div>
			</AlertDialogContent>
		</AlertDialog>
	)
}
