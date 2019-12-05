import { FormGroup, FormGroupProps } from '@contember/ui'
import * as React from 'react'
import {
	Entity,
	EntityAccessor,
	Environment,
	FieldBasicProps,
	isScalar,
	useEntityContext,
	useEnvironment,
	useMutationState,
	useRelativeSingleField,
} from '../../../../binding'
import { SimpleRelativeSingleFieldMetadata } from './SimpleRelativeSingleField'

export type SimpleRelativeSingleFieldInnerProps = FieldBasicProps &
	Omit<FormGroupProps, 'children'> & {
		render: undefined | ((fieldMetadata: SimpleRelativeSingleFieldMetadata<any, any>, props: any) => React.ReactNode)
	}

const contextualizeNode = (
	node: React.ReactNode,
	parentEntity: EntityAccessor,
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
	if (isScalar(node)) {
		return node
	}
	return <Entity accessor={parentEntity}>{node}</Entity>
}

export const SimpleRelativeSingleFieldInner = React.memo(
	({ render, ...props }: SimpleRelativeSingleFieldInnerProps) => {
		const immediateParentEntity = useEntityContext()
		const environment = useEnvironment()
		const isMutating = useMutationState()
		const field = useRelativeSingleField(props)

		const fieldMetadata: SimpleRelativeSingleFieldMetadata = React.useMemo(
			() => ({
				field,
				environment,
				isMutating,
			}),
			[environment, field, isMutating],
		)

		const normalizedLabel = React.useMemo(() => contextualizeNode(props.label, immediateParentEntity, environment), [
			environment,
			immediateParentEntity,
			props.label,
		])
		const normalizedLabelDescription = React.useMemo(
			() => contextualizeNode(props.labelDescription, immediateParentEntity, environment, 'labelMiddleware'),
			[environment, immediateParentEntity, props.labelDescription],
		)
		const normalizedDescription = React.useMemo(
			() => contextualizeNode(props.description, immediateParentEntity, environment),
			[environment, immediateParentEntity, props.description],
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
						label={normalizedLabel}
						size={props.size}
						labelDescription={normalizedLabelDescription}
						labelPosition={props.labelPosition}
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
SimpleRelativeSingleFieldInner.displayName = 'SimpleRelativeSingleFieldInner'
