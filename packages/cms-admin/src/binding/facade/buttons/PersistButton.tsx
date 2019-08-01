import * as React from 'react'
import { Button, Intent } from '../../../components'
import { MetaOperationsContext } from '../../coreComponents'
import { DirtinessContext, MutationStateContext } from '../../coreComponents/PersistState'

export type PersistButtonProps = React.PropsWithChildren<{}>

export const PersistButton = React.memo((props: PersistButtonProps) => {
	const isMutating = React.useContext(MutationStateContext)
	const isDirty = React.useContext(DirtinessContext)
	const value = React.useContext(MetaOperationsContext)
	const buttonRef = React.useRef<HTMLButtonElement | null>(null)

	const isDisabled = isMutating || !isDirty

	if (value) {
		return (
			<Button
				intent={Intent.Success}
				// icon="floppy-disk"
				onClick={() => {
					value.triggerPersist()

					buttonRef.current && buttonRef.current.blur()
				}}
				// intent={Intent.PRIMARY}
				disabled={isDisabled}
				ref={buttonRef}
				large
			>
				{props.children || 'Save'}
			</Button>
		)
	}
	return null
})
