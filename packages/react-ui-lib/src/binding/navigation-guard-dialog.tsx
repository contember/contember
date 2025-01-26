import { useCallback, useState } from 'react'
import { dict } from '../dict'
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogTitle } from '../ui/alert-dialog'
import { BlockNavigationOnDirtyStateResult, useBlockNavigationOnDirtyState } from '@contember/interface'
import { usePersistFeedbackHandlers } from './hooks'
import { Button } from '../ui/button'
import { SaveIcon } from 'lucide-react'

/**
 * NavigationGuardDialog component - Prevents accidental navigation with unsaved changes
 *
 * #### Purpose
 * Protects against data loss by intercepting navigation attempts when form state is dirty. It's a part of the core `Binding` components.
 *
 * #### User Flow
 * 1. Detects unsaved changes when navigation occurs
 * 2. Shows confirmation dialog with three options:
 *    - **Save**: Persists changes before navigating
 *    - **Don't Save**: Discards changes and proceeds
 *    - **Cancel**: Aborts navigation
 *
 * #### Features
 * - Integrated with Contember's dirty state tracking
 * - Customizable dialog appearance
 * - Promise-based resolution handling
 * - Visual feedback with save/discard indicators
 *
 * #### Integration
 * - Works with `useBlockNavigationOnDirtyState` hook
 * - Connects to application's feedback handlers
 * - Uses shared UI components (AlertDialog, Button)
 *
 * #### Example
 * ```tsx
 * <DataBindingProvider stateComponent={BindingStateRenderer}>
 *   <NavigationGuardDialog />
 *   <AppContent />
 * </DataBindingProvider>
 * ```
 *
 * #### Visual Elements
 * - Save button with icon
 * - Destructive-style discard button
 * - Neutral cancel option
 * - Clear warning title
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
