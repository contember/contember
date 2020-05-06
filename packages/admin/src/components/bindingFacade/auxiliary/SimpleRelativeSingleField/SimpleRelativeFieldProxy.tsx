import * as React from 'react'
import {
	Entity,
	EntityAccessor,
	Environment,
	SugaredRelativeSingleField,
	useEntityAccessor,
	useEnvironment,
	useRelativeSingleField,
} from '@contember/binding'
import { isScalar } from '../../../../utils'
import { SimpleRelativeSingleFieldInner, SimpleRelativeSingleFieldInnerProps } from './SimpleRelativeSingleFieldInner'

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

export type SimpleRelativeSingleFieldProxyProps = Omit<SimpleRelativeSingleFieldInnerProps, 'field'> &
	SugaredRelativeSingleField

export const SimpleRelativeSingleFieldProxy = React.memo((props: SimpleRelativeSingleFieldProxyProps) => {
	const immediateParentEntity = useEntityAccessor()
	const environment = useEnvironment()
	const field = useRelativeSingleField(props)

	const normalizedLabel = React.useMemo(
		() => contextualizeNode(props.label, immediateParentEntity, environment, 'labelMiddleware'),
		[environment, immediateParentEntity, props.label],
	)
	const normalizedLabelDescription = React.useMemo(
		() => contextualizeNode(props.labelDescription, immediateParentEntity, environment),
		[environment, immediateParentEntity, props.labelDescription],
	)
	const normalizedDescription = React.useMemo(
		() => contextualizeNode(props.description, immediateParentEntity, environment),
		[environment, immediateParentEntity, props.description],
	)

	return (
		<SimpleRelativeSingleFieldInner
			{...props}
			field={field}
			label={normalizedLabel}
			labelDescription={normalizedLabelDescription}
			description={normalizedDescription}
		/>
	)
})
SimpleRelativeSingleFieldProxy.displayName = 'SimpleRelativeSingleFieldProxy'
