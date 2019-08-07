import { Icon } from '@blueprintjs/core'
import { IconNames } from '@blueprintjs/icons'
import * as React from 'react'
import { Button, ButtonProps } from '../../../components/ui'
import { DataContext } from '../../coreComponents'
import { MutationStateContext } from '../../coreComponents/PersistState'
import { FieldAccessor } from '../../dao'

export interface ClearFieldButtonProps extends ButtonProps {}

export const ClearFieldButton = (props: ClearFieldButtonProps) => {
	const value = React.useContext(DataContext)
	const isMutating = React.useContext(MutationStateContext)
	const onClick = React.useCallback(() => {
		if (!(value instanceof FieldAccessor) || !value.updateValue) {
			return
		}
		value.updateValue(null)
	}, [value])

	if (!(value instanceof FieldAccessor) || !value.updateValue) {
		return null
	}

	return (
		<Button {...props} onClick={onClick} disabled={isMutating} small minimal>
			<Icon icon={IconNames.CROSS} color="currentColor" />
		</Button>
	)
}
