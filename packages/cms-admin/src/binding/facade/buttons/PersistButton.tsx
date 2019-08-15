import { Button, ButtonProps } from '@contember/ui'
import * as React from 'react'
import { MetaOperationsContext } from '../../coreComponents'
import { DirtinessContext, MutationStateContext } from '../../coreComponents/PersistState'

export type PersistButtonProps = ButtonProps

export const PersistButton = React.memo((props: PersistButtonProps) => {
	const isMutating = React.useContext(MutationStateContext)
	const isDirty = React.useContext(DirtinessContext)
	const value = React.useContext(MetaOperationsContext)
	const buttonRef = React.useRef<HTMLButtonElement | null>(null)

	const isDisabled = isMutating || !isDirty

	if (value) {
		return (
			<Button
				intent="primary"
				onClick={() => {
					value.triggerPersist()
					buttonRef.current && buttonRef.current.blur()
				}}
				disabled={isDisabled}
				isLoading={isMutating}
				ref={buttonRef}
				size="large"
			>
				{props.children || 'Save'}
			</Button>
		)
	}
	return null
})
