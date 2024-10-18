import { ComponentType, memo, SetStateAction, useCallback, useState } from 'react'
import { createRequiredContext } from '@contember/react-utils'

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
