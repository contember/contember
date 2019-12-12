import { FormGroup, FormGroupProps } from '@contember/ui'
import * as React from 'react'
import { FieldAccessor, useEnvironment, useMutationState } from '../../../../binding'
import { SimpleRelativeSingleFieldMetadata } from './SimpleRelativeSingleField'

export type SimpleRelativeSingleFieldInnerProps = Omit<FormGroupProps, 'children'> & {
	render: undefined | ((fieldMetadata: SimpleRelativeSingleFieldMetadata<any, any>, props: any) => React.ReactNode)
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

		const rendered = React.useMemo<React.ReactNode>(() => {
			if (render === undefined) {
				return null
			}
			return render(fieldMetadata, props)
		}, [fieldMetadata, props, render])

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
