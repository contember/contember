import { ReactNode } from 'react'
import { useEntity } from '../accessorPropagation'
import { EntityAccessor } from '../accessors'
import { SugaredRelativeSingleEntity } from '../treeParameters'

export interface EntityViewProps {
	render: (entity: EntityAccessor) => ReactNode
	field?: string | SugaredRelativeSingleEntity
}

export function EntityView(props: EntityViewProps) {
	// eslint-disable-next-line react-hooks/rules-of-hooks
	const entity = 'field' in props ? useEntity(props.field)! : useEntity()

	return <>{props.render(entity)}</>
}
