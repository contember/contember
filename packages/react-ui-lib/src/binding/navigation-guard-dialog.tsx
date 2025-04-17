import { useCallback, useState } from 'react'
import { dict } from '../dict'
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogTitle } from '../ui/alert-dialog'
import { BlockNavigationOnDirtyStateResult, useBlockNavigationOnDirtyState } from '@contember/interface'
import { usePersistFeedbackHandlers } from './hooks'
import { Button } from '../ui/button'
import { SaveIcon } from 'lucide-react'

/**
 * `NavigationGuardDialog` component prompts users with a confirmation dialog when attempting to navigate away
 * from a page with unsaved changes.
 *
 * This component integrates with {@link useBlockNavigationOnDirtyState} to prevent accidental data loss.
 * The user can choose to save, discard, or cancel the navigation attempt.
 *
 * #### Example: Basic Usage
 * ```tsx
 * <NavigationGuardDialog />
 * ```
 */
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
				<AlertDialogTitle>{dict.navigationGuardDialog.title}</AlertDialogTitle>
				{dict.navigationGuardDialog.description}
				<div className="flex gap-2 justify-end">
					<Button onClick={() => resolver?.('save')}>
						<SaveIcon className="w-4 h-4 mr-2" />
						{dict.navigationGuardDialog.confirmButton}
					</Button>
					<Button onClick={() => resolver?.('discard')} variant="outline"
						className="border-destructive/50  text-destructive hover:bg-red-100 hover:text-destructive">
						{dict.navigationGuardDialog.discardButton}
					</Button>
					<AlertDialogCancel onClick={() => resolver?.('cancel')} className="border-gray-500">{dict.navigationGuardDialog.cancelButton}</AlertDialogCancel>
				</div>
			</AlertDialogContent>
		</AlertDialog>
	)
}
