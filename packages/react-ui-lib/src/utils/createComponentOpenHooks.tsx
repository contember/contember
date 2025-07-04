import { ComponentType, memo, SetStateAction, useCallback, useState } from 'react'
import { createRequiredContext } from '@contember/react-utils'

/**
 * `createComponentOpenHooks` wraps a component that supports open state management
 * (`open`, `defaultOpen`, `onOpenChange`) and injects context-based control and access hooks.
 *
 * It returns:
 * - A `Component` wrapped with open state context
 * - A `useOpen` hook to access and control the open state
 *
 * This is especially useful for modals, drawers, popovers, and similar toggleable UI components.
 *
 * #### Example: Creating a toggleable modal with context access
 * ```tsx
 * const BaseModal: React.FC<{ open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void }> = ({ open, onOpenChange }) => (
 *   <div style={{ display: open ? 'block' : 'none' }}>
 *     <button onClick={() => onOpenChange?.(false)}>Close</button>
 *     <p>Modal Content</p>
 *   </div>
 * )
 *
 * const { Component: ModalWithHooks, useOpen } = createComponentOpenHooks(BaseModal)
 *
 * const App = () => {
 *   const [open, setOpen] = useOpen()
 *
 *   return (
 *     <>
 *       <button onClick={() => setOpen(true)}>Open Modal</button>
 *       <ModalWithHooks />
 *     </>
 *   )
 * }
 * ```
 */
export const createComponentOpenHooks = <P extends {
	open?: boolean
	defaultOpen?: boolean
	onOpenChange?(open: boolean): void
}>(Component: ComponentType<P>): {
	Component: ComponentType<P>
	useOpen: () => [boolean, (value: SetStateAction<boolean>) => void]
} => {
	const [ctx, useOpen] = createRequiredContext<[boolean, (value: SetStateAction<boolean>) => void]>(`${Component.displayName ?? 'UnnamedComponent'}OpenContext`)
	const WrappedComponent = memo<P>(({ open: openIn, defaultOpen, onOpenChange, ...props }) => {
		const [open, setOpenInternal] = useState(openIn ?? defaultOpen ?? false)
		if (openIn !== undefined && open !== openIn) {
			setOpenInternal(openIn)
		}
		const setOpen = useCallback((value: SetStateAction<boolean>) => {
			setOpenInternal(it => {
				const newValue = typeof value === 'function' ? value(it) : value
				onOpenChange?.(newValue)
				return newValue
			})
		}, [onOpenChange])

		return (
			<ctx.Provider value={[open, setOpen]}>
				<Component {...(props as P)} open={open} onOpenChange={setOpen} />
			</ctx.Provider>
		)
	})
	WrappedComponent.displayName = Component.displayName

	return {
		Component: WrappedComponent,
		useOpen,
	}
}
