import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'
import { uic } from '../utils'
import { createComponentOpenHooks } from '../utils/createComponentOpenHooks'
import { buttonConfig } from './button'

const { Component, useOpen } = createComponentOpenHooks(AlertDialogPrimitive.Root)

/**
 * `AlertDialog` component - an interruptive modal dialog that requires a user interaction
 * to be dismissed. It is used to confirm user actions or to inform the user
 * about important information that requires attention.
 *
 * #### Example
 * ```tsx
 * <AlertDialog>
 *   <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
 *   <AlertDialogContent>
 *     <AlertDialogHeader>
 *       <AlertDialogTitle>Are you sure?</AlertDialogTitle>
 *       <AlertDialogDescription>
 *         This action cannot be undone.
 *       </AlertDialogDescription>
 *     </AlertDialogHeader>
 *     <AlertDialogFooter>
 *       <AlertDialogCancel>Cancel</AlertDialogCancel>
 *       <AlertDialogAction>Continue</AlertDialogAction>
 *     </AlertDialogFooter>
 *   </AlertDialogContent>
 * </AlertDialog>
 * ```
 *
 * #### Sub-components
 * - {@link AlertDialogPortal}
 * - {@link AlertDialogContent}
 * - {@link AlertDialogHeader}
 * - {@link AlertDialogFooter}
 * - {@link AlertDialogTitle}
 * - {@link AlertDialogDescription}
 * - {@link AlertDialogAction}
 * - {@link AlertDialogCancel}
 *
 * #### Hooks
 * - {@link useAlertDialogOpenState}
*/
export const AlertDialog = Component


/**
 * `useAlertDialogOpenState` is a custom hook alias for `useOpen`, providing a stateful mechanism to control the open/closed state of an alert dialog. It returns a tuple `[isOpen, setIsOpen]`, allowing React components to programmatically open or close dialogs.
 *
 * Useful in scenarios where dialogs are rendered conditionally and need manual control over visibility, such as after successful form submissions.
 *
 * #### Example: Controlling dialog visibility after a successful save
 *
 * ```tsx
 * const SaveButton = () => {
 * 	const [, setOpen] = useAlertDialogOpenState()
 *
 * 	return (
 * 		<PersistTrigger
 * 			onPersistSuccess={() => {
 * 				setOpen(false)
 * 				reloadDataGrid()
 * 			}}
 * 		>
 * 			<Button>Save</Button>
 * 		</PersistTrigger>
 * 	)
 * }
 * ```
 *
 * @group AlertDialog
 */
export const useAlertDialogOpenState = useOpen

/**
* `AlertDialogTrigger` is the trigger button to open the dialog.
* Must be used within `AlertDialog`.
*
* See more {@link AlertDialog}
*
* @group AlertDialog
*/
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger

/**
* `AlertDialogPortal` is the portal to render the dialog.
* Must be used within `AlertDialog`.
*
* See more {@link AlertDialog}
*
* @group AlertDialog
*/
export const AlertDialogPortal = AlertDialogPrimitive.Portal

/**
* `AlertDialogOverlay` is the overlay to render the dialog.
* Must be used within `AlertDialog`.
*
* See more {@link AlertDialog}
*
* @group AlertDialog
*/
export const AlertDialogOverlay = uic(AlertDialogPrimitive.Overlay, {
	baseClass: 'fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
	displayName: 'AlertDialogOverlay',
})

/**
* `AlertDialogContent` is the content of the alert dialog.
* Must be used within `AlertDialog`.
*
* For documentation see {@link AlertDialog}
*
* @group AlertDialog
*/
export const AlertDialogContent = uic(AlertDialogPrimitive.Content, {
	baseClass: 'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
	wrapOuter: props => {
		return (
			<AlertDialogPortal>
				<AlertDialogOverlay />
				{props.children}
			</AlertDialogPortal>
		)
	},
	displayName: 'AlertDialogContent',
})

/**
* `AlertDialogHeader` is the header of the alert dialog. Must be used within `AlertDialog`. Usually contains the title and description of the alert dialog.
*
* See more {@link AlertDialog}
*
* @group AlertDialog
*/
export const AlertDialogHeader = uic('div', {
	baseClass: 'flex flex-col space-y-2 text-center sm:text-left',
	displayName: 'AlertDialogHeader',
})

/**
* `AlertDialogFooter` is the footer of the alert dialog. Must be used within `AlertDialog`. Usually contains the buttons of the alert dialog.
*
* See more {@link AlertDialog}
*
* @group AlertDialog
*/
export const AlertDialogFooter = uic('div', {
	baseClass: 'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
	displayName: 'AlertDialogFooter',
})

/**
* `AlertDialogTitle` is the title of the alert dialog. Must be used within `AlertDialogHeader`. Usually contains the title of the alert dialog.
*
* See more {@link AlertDialog}
*
* @group AlertDialog
*/
export const AlertDialogTitle = uic(AlertDialogPrimitive.Title, {
	baseClass: 'text-lg font-semibold',
	displayName: 'AlertDialogTitle',
})

/**
* `AlertDialogDescription` is the description of the alert dialog. Must be used within `AlertDialogHeader`. Usually contains the description of the alert dialog.
*
* See more {@link AlertDialog}
*
* @group AlertDialog
*/
export const AlertDialogDescription = uic(AlertDialogPrimitive.Description, {
	baseClass: 'text-sm text-muted-foreground',
	displayName: 'AlertDialogDescription',
})

/**
* `AlertDialogAction` is the action button of the alert dialog. Must be used within `AlertDialogFooter`. Usually contains the action button of the alert dialog.
*
* See more {@link AlertDialog}
*
* @group AlertDialog
*/
export const AlertDialogAction = uic(AlertDialogPrimitive.Action, buttonConfig)

/**
* `AlertDialogCancel` is the cancel button of the alert dialog. Must be used within `AlertDialogFooter`. Usually contains the cancel button of the alert dialog.
*
* See more {@link AlertDialog}
*
* @group AlertDialog
*/
export const AlertDialogCancel = uic(AlertDialogPrimitive.Cancel, {
	...buttonConfig,
	defaultVariants: {
		variant: 'outline',
		size: 'default',
	},
})
