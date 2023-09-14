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
}

export interface IfCallbackProps {
	condition: (accessor: EntityAccessor) => boolean
	children?: ReactNode
}

/**
 * @group Logic Components
 */
export const If = Component<IfProps>(props => {
		return typeof props.condition !== 'function'
			? <IfFilter condition={props.condition}>{props.children}</IfFilter>
			: <IfCallback condition={props.condition}>{props.children}</IfCallback>
	},
	'If',
)

const IfCallback = Component<IfCallbackProps>(
	({ children, condition }) => {
		const entity = useEntity()
		const evaluated = useMemo(() => condition(entity), [condition, entity])

		return evaluated ? <>{children}</> : null
	},
	({ children }) => {
		return <>{children}</>
	},
	'IfCallback',
)

const IfFilter = Component<IfFilterProps>(
	({ children, condition }) => {
		const env = useEnvironment()
		const entity = useEntity()

		const schema = env.getSchema()
		const evaluated = useMemo(
			() => new FilterEvaluator(schema).evaluateFilter(entity, QueryLanguage.desugarFilter(condition, env)),
			[condition, entity, env, schema],
		)

		return evaluated ? <>{children}</> : null
	},
	({ children, condition }, env) => {
		const desugaredFilter = QueryLanguage.desugarFilter(condition, env)
		const collectedFields = new FilterFieldsCollector(env.getSchema(), desugaredFilter).collectFields(env.getSubTreeNode().entity)
		const additionalFields = <>{Array.from(collectedFields).map(it => <Field field={it} key={it} />)}</>

		return <>
			{additionalFields}
			{children}
		</>
	},
	'IfFilter',
)

