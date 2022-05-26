import { SugaredRelativeSingleField, useEnvironment, useField, useMutationState } from '@contember/binding'
import { FieldContainer, FieldContainerProps } from '@contember/ui'
import { memo, ReactNode, useMemo } from 'react'
import { useAccessorErrors } from '../../errors'
import type { SimpleRelativeSingleFieldMetadata } from './SimpleRelativeSingleField'
import { useLabelMiddleware } from '../../environment/LabelMiddleware'

export type SimpleRelativeSingleFieldProxyProps = Omit<FieldContainerProps, 'children'> &
	SugaredRelativeSingleField & {
		render: (fieldMetadata: SimpleRelativeSingleFieldMetadata<any>, props: any) => ReactNode
	}

export const SimpleRelativeSingleFieldProxy = memo(
	({ render, label, labelDescription, labelPosition, description, ...props }: SimpleRelativeSingleFieldProxyProps) => {
		const environment = useEnvironment()
		const field = useField(props)
		const labelMiddleware = useLabelMiddleware()

		const normalizedLabel = useMemo(() => labelMiddleware(label), [labelMiddleware, label])

		const isMutating = useMutationState()

		const fieldMetadata: SimpleRelativeSingleFieldMetadata = useMemo(
			() => ({
				field,
				environment,
				isMutating,
			}),
			[environment, field, isMutating],
		)
		const fieldErrors = useAccessorErrors(field)

		const rendered = render(fieldMetadata, props)

		return (
			<>
				{rendered && (
					<FieldContainer
						label={normalizedLabel}
						size={props.size}
						labelDescription={labelDescription}
						labelPosition={labelPosition}
						description={description}
						errors={fieldErrors}
					>
						{rendered}
					</FieldContainer>
				)}
			</>
		)
	},
)
SimpleRelativeSingleFieldProxy.displayName = 'SimpleRelativeSingleFieldProxy'
