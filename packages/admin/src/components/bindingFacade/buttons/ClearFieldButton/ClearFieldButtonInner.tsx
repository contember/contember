import type { FieldAccessor } from '@contember/binding'
import { Button, ButtonProps, Icon } from '@contember/ui'
import { useCallback } from 'react'

export type ClearFieldButtonInnerPublicProps = ButtonProps

export interface ClearFieldButtonInnerInternalProps {
	field: FieldAccessor
	isMutating: boolean
}

export type ClearFieldButtonInnerProps = ClearFieldButtonInnerPublicProps & ClearFieldButtonInnerInternalProps

/**
 * @internal
 */
export const ClearFieldButtonInner = (props: ClearFieldButtonInnerProps) => {
	const { field, isMutating, ...buttonProps } = props
	const onClick = useCallback(() => {
		field.updateValue(null)
	}, [field])

	return (
		<Button
			onClick={onClick}
			disabled={isMutating}
			size="small"
			flow="squarish"
			distinction="seamless"
			{...buttonProps}
		>
			<Icon blueprintIcon="cross" />
		</Button>
	)
}
