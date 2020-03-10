import { FormGroup, FormGroupProps } from '@contember/ui'
import * as React from 'react'
import { FieldAccessor, useEnvironment, useMutationState } from '@contember/binding'
import { SimpleRelativeSingleFieldMetadata } from './SimpleRelativeSingleField'

export type SimpleRelativeSingleFieldInnerProps = Omit<FormGroupProps, 'children'> & {
	render: (fieldMetadata: SimpleRelativeSingleFieldMetadata<any, any>, props: any) => React.ReactNode
	field: FieldAccessor
}

export const SimpleRelativeSingleFieldInner = React.memo(
	({
		render,
		field,
		label,
		labelDescription,
		labelPosition,
		description,
		...props
	}: SimpleRelativeSingleFieldInnerProps) => {
		const environment = useEnvironment()
		const isMutating = useMutationState()

		const fieldMetadata: SimpleRelativeSingleFieldMetadata = React.useMemo(
			() => ({
				field,
				environment,
				isMutating,
			}),
			[environment, field, isMutating],
		)

		const rendered = render(fieldMetadata, props)

		return (
			<>
				{rendered && (
					<FormGroup
						label={label}
						size={props.size}
						labelDescription={labelDescription}
						labelPosition={labelPosition}
						description={description}
						errors={fieldMetadata.field.errors}
					>
						{rendered}
					</FormGroup>
				)}
			</>
		)
	},
)
SimpleRelativeSingleFieldInner.displayName = 'SimpleRelativeSingleFieldInner'
