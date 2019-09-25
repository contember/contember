import { Button, ButtonProps } from '@contember/ui'
import * as React from 'react'
import { DirtinessContext, ErrorPersistResult, MetaOperationsContext, MutationStateContext } from '../../coreComponents'

export type PersistButtonProps = ButtonProps

export const PersistButton = React.memo((props: PersistButtonProps) => {
	const isMutating = React.useContext(MutationStateContext)
	const isDirty = React.useContext(DirtinessContext)
	const value = React.useContext(MetaOperationsContext)
	const buttonRef = React.useRef<HTMLButtonElement | null>(null)
	const onClick = React.useCallback(() => {
		value!
			.triggerPersist()
			.then(result => {
				console.log('persist success', result)
			})
			.catch((result: ErrorPersistResult) => {
				console.log('persist error', result)
			})
		//buttonRef.current && buttonRef.current.blur()
	}, [value])

	const isDisabled = isMutating || !isDirty

	if (!value) {
		return null
	}
	return (
		<Button
			intent="primary"
			onClick={onClick}
			disabled={isDisabled}
			isLoading={isMutating}
			ref={buttonRef}
			size="large"
		>
			{props.children || 'Save'}
		</Button>
	)
})
PersistButton.displayName = 'PersistButton'
