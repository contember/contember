import * as React from 'react'
import {
	Entity,
	EntityAccessor,
	Environment,
	SugaredRelativeSingleField,
	useParentEntityAccessor,
	useEnvironment,
	useRelativeSingleField,
} from '@contember/binding'
import { isScalar } from '../../../../utils'
import { SimpleRelativeSingleFieldInner, SimpleRelativeSingleFieldInnerProps } from './SimpleRelativeSingleFieldInner'

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
	if (isScalar(node)) {
		return node
	}
	return node
}

export type SimpleRelativeSingleFieldProxyProps = Omit<SimpleRelativeSingleFieldInnerProps, 'field'> &
	SugaredRelativeSingleField

export const SimpleRelativeSingleFieldProxy = React.memo((props: SimpleRelativeSingleFieldProxyProps) => {
	const environment = useEnvironment()
	const field = useRelativeSingleField(props)

	const normalizedLabel = React.useMemo(() => contextualizeNode(props.label, environment, 'labelMiddleware'), [
		environment,
		props.label,
	])
	const normalizedLabelDescription = React.useMemo(() => contextualizeNode(props.labelDescription, environment), [
		environment,
		props.labelDescription,
	])
	const normalizedDescription = React.useMemo(() => contextualizeNode(props.description, environment), [
		environment,
		props.description,
	])

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
