import { Environment, SugaredRelativeSingleField, useEnvironment, useMutationState, useField } from '@contember/binding'
import { FormGroup, FormGroupProps } from '@contember/ui'
import * as React from 'react'
import { SimpleRelativeSingleFieldMetadata } from './SimpleRelativeSingleField'

const contextualizeNode = (
	node: React.ReactNode,
	environment: Environment,
	middlewareName?: Environment.SystemMiddlewareName,
) => {
	if (node === undefined || node === null) {
		return undefined
	}
	if (middlewareName) {
		// TODO this will fail once there are more middleware types.
		// Welcome, future developer, sent here by TypeScript.
		node = environment.applySystemMiddleware(middlewareName, node)
	}
	return node
}

export type SimpleRelativeSingleFieldProxyProps = Omit<FormGroupProps, 'children'> &
	SugaredRelativeSingleField & {
		render: (fieldMetadata: SimpleRelativeSingleFieldMetadata<any, any>, props: any) => React.ReactNode
	}

export const SimpleRelativeSingleFieldProxy = React.memo(
	({ render, label, labelDescription, labelPosition, description, ...props }: SimpleRelativeSingleFieldProxyProps) => {
		const environment = useEnvironment()
		const field = useField(props)

		const normalizedLabel = React.useMemo(() => contextualizeNode(label, environment, 'labelMiddleware'), [
			environment,
			label,
		])
		const normalizedLabelDescription = React.useMemo(() => contextualizeNode(labelDescription, environment), [
			environment,
			labelDescription,
		])
		const normalizedDescription = React.useMemo(() => contextualizeNode(description, environment), [
			environment,
			description,
		])
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
						label={normalizedLabel}
						size={props.size}
						labelDescription={normalizedLabelDescription}
						labelPosition={labelPosition}
						description={normalizedDescription}
						errors={fieldMetadata.field.errors}
					>
						{rendered}
					</FormGroup>
				)}
			</>
		)
	},
)
SimpleRelativeSingleFieldProxy.displayName = 'SimpleRelativeSingleFieldProxy'
