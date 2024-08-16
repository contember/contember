import type { ReactNode } from 'react'
import { useEntity } from '../accessorPropagation'
import type { EntityAccessor } from '@contember/binding'
import type { SugaredRelativeSingleEntity } from '@contember/binding'

export interface EntityViewProps {
	render: (entity: EntityAccessor) => ReactNode
	field?: string | SugaredRelativeSingleEntity
}

/**
 * @group Data binding
 */
export function EntityView(props: EntityViewProps) {
	// eslint-disable-next-line react-hooks/rules-of-hooks
	const entity = 'field' in props ? useEntity(props.field)! : useEntity()

	return <>{props.render(entity)}</>
}
