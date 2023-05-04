import type { ReactNode } from 'react'
import { useEntity } from '../accessorPropagation'
import type { EntityAccessor } from '../accessors'
import type { SugaredRelativeSingleEntity } from '../treeParameters'

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
