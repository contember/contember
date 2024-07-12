import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { Component, Field } from '../coreComponents'
import { EntityAccessor } from '@contember/binding'
import { QueryLanguage } from '@contember/binding'
import { useEntity, useEnvironment } from '../accessorPropagation'
import { Filter } from '@contember/binding'
import { FilterFieldsCollector } from './helpers/FilterFieldsCollector'
import { FilterEvaluator } from './helpers/FilterEvaluator'

export type IfProps =
	| IfFilterProps
	| IfCallbackProps

export interface IfFilterProps {
	condition: string | Filter
	children?: ReactNode
	then?: ReactNode
	else?: ReactNode
}

export interface IfCallbackProps {
	condition: (accessor: EntityAccessor) => boolean
	children?: ReactNode
	then?: ReactNode
	else?: ReactNode
}

/**
 * @group Logic Components
 */
export const If = Component<IfProps>(({ condition, ...props }) => {
		if (props.children && props.then) {
			throw new Error('If component cannot have both children and then prop')
		}
		return typeof condition !== 'function'
			? <IfFilter condition={condition} {...props} />
			: <IfCallback condition={condition} {...props} />
	},
	'If',
)

const IfCallback = Component<IfCallbackProps>(
	({ children, condition, then, else: elseIn }) => {
		const entity = useEntity()
		const evaluated = useMemo(() => condition(entity), [condition, entity])

		return <>{evaluated ? (children ?? then) : elseIn}</>
	},
	({ children, then, else: elseIn }) => {
		return <>
			{children}
			{then}
			{elseIn}
		</>
	},
	'IfCallback',
)

const IfFilter = Component<IfFilterProps>(
	({ children, condition, then, else: elseIn }) => {
		const env = useEnvironment()
		const entity = useEntity()

		const schema = env.getSchema()
		const evaluated = useMemo(
			() => new FilterEvaluator(schema).evaluateFilter(entity, QueryLanguage.desugarFilter(condition, env)),
			[condition, entity, env, schema],
		)
		return <>{evaluated ? (children ?? then) : elseIn}</>
	},
	({ children, condition, then, else: elseIn }, env) => {
		const desugaredFilter = QueryLanguage.desugarFilter(condition, env)
		const collectedFields = new FilterFieldsCollector(env.getSchema(), desugaredFilter).collectFields(env.getSubTreeNode().entity)
		const additionalFields = <>{Array.from(collectedFields).map(it => <Field field={it} key={it} />)}</>

		return <>
			{additionalFields}
			{children}
			{then}
			{elseIn}
		</>
	},
	'IfFilter',
)
