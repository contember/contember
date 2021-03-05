import { Environment, SugaredRelativeSingleField, useEnvironment, useField, useMutationState } from '@contember/binding'
import { FormGroup, FormGroupProps } from '@contember/ui'
import { memo, ReactNode, useMemo } from 'react'
import { SimpleRelativeSingleFieldMetadata } from './SimpleRelativeSingleField'

const contextualizeNode = (
	node: ReactNode,
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
		render: (fieldMetadata: SimpleRelativeSingleFieldMetadata<any, any>, props: any) => ReactNode
	}

export const SimpleRelativeSingleFieldProxy = memo(
	({ render, label, labelDescription, labelPosition, description, ...props }: SimpleRelativeSingleFieldProxyProps) => {
		const environment = useEnvironment()
		const field = useField(props)

		const normalizedLabel = useMemo(() => contextualizeNode(label, environment, 'labelMiddleware'), [
			environment,
			label,
		])
		const normalizedLabelDescription = useMemo(() => contextualizeNode(labelDescription, environment), [
			environment,
			labelDescription,
		])
		const normalizedDescription = useMemo(() => contextualizeNode(description, environment), [environment, description])
		const isMutating = useMutationState()

		const fieldMetadata: SimpleRelativeSingleFieldMetadata = useMemo(
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
