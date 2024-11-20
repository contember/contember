import {
	Environment,
	SugarableHasOneRelation,
	SugaredRelativeEntityList,
	SugaredRelativeSingleEntity,
	TokenRegExps,
} from '@contember/binding'
import { ReactNode, useMemo } from 'react'
import { Component } from '../coreComponents'

export interface RecursionTerminatorOptions {
	shouldTerminate?: (args: { node: Environment.AnyNode; field: string; environment: Environment }) => boolean | undefined
}

export const recursionTerminatorEnvironmentExtension = Environment.createExtension((options: RecursionTerminatorOptions | undefined) => {
	return options
})

export interface RecursionTerminatorProps {
	field:
		| { kind: 'hasOne'; field: SugaredRelativeSingleEntity['field'] }
		| { kind: 'hasMany'; field: SugaredRelativeEntityList['field'] }
	children: ReactNode
}

export const RecursionTerminator = Component<RecursionTerminatorProps>(({ field, children }, env) => {
	const isRecursion = useMemo(() => {
		return recursionDetector(field, env)
	}, [field, env])

	return !isRecursion ? children : null
}, ({ field, children }, env) => {
	const isRecursion = recursionDetector(field, env)
	return !isRecursion ? children : null
})

const recursionDetector = (field: RecursionTerminatorProps['field'], env: Environment) => {
	const firstPathItem = getFirstPathItem(field)
	if (!firstPathItem) {
		return false
	}
	const shouldTerminate = env.getExtension(recursionTerminatorEnvironmentExtension)?.shouldTerminate
	const shouldTerminateResult = shouldTerminate?.({ node: env.getSubTreeNode(), field: firstPathItem, environment: env })
	if (shouldTerminateResult !== undefined) {
		return shouldTerminateResult
	}

	const node = env.getSubTreeNode()
	const otherSide = node.type === 'entity-list' || node.type === 'entity' ? (node.field.ownedBy ?? node.field.inversedBy) : undefined
	if (!otherSide) {
		return false
	}
	if (!firstPathItem) {
		return false
	}
	return otherSide === firstPathItem
}

const getFirstPathItem = (field: RecursionTerminatorProps['field']) => {
	if (typeof field.field === 'string') {
		return field.field.match(TokenRegExps.identifier)?.[0]
	}
	const getFromHasOne = (relation: SugarableHasOneRelation[] | SugarableHasOneRelation | undefined) => {
		if (Array.isArray(relation)) {
			return relation?.[0].field
		}
		return relation?.field
	}
	if (field.kind === 'hasMany') {
		return getFromHasOne(field.field.hasOneRelationPath) ?? field.field.hasManyRelation.field
	}
	return getFromHasOne(field.field)
}
