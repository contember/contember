import { Icon } from '@blueprintjs/core'
import { IconNames } from '@blueprintjs/icons'
import * as React from 'react'
import { Button, ButtonProps } from '../../../../components/ui'
import { MutationStateContextValue } from '../../../coreComponents/PersistState'
import { FieldAccessor } from '../../../dao'

export interface ClearFieldButtonInnerPublicProps extends ButtonProps {}

export interface ClearFieldButtonInnerInternalProps {
	field: FieldAccessor
	isMutating: MutationStateContextValue
}

export interface ClearFieldButtonInnerProps
	extends ClearFieldButtonInnerPublicProps,
		ClearFieldButtonInnerInternalProps {}

export const ClearFieldButtonInner = (props: ClearFieldButtonInnerProps) => {
	const { field, isMutating, ...buttonProps } = props
	const onClick = React.useCallback(() => {
		if (!field.updateValue) {
			return
		}
		field.updateValue(null)
	}, [field])

	return (
		<Button {...buttonProps} onClick={onClick} disabled={isMutating} small minimal>
			<Icon icon={IconNames.CROSS} color="currentColor" />
		</Button>
	)
}
