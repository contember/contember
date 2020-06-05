import * as React from 'react'
import { EntityListAccessor } from '../accessors'
import { SingleEntity, SingleEntityBaseProps } from './SingleEntity'

export interface EntityListBaseProps {
	accessor: EntityListAccessor
	children?: React.ReactNode
}

export type EntityListProps<ListProps, EntityProps> = EntityListBaseProps &
	(
		| {}
		| {
				entityComponent: React.ComponentType<EntityProps & SingleEntityBaseProps>
				entityProps: EntityProps
		  }
		| {
				listComponent: React.ComponentType<ListProps & EntityListBaseProps>
				listProps: ListProps
		  }
	)

export function EntityList<ListProps, EntityProps>(props: EntityListProps<ListProps, EntityProps>) {
	if ('listComponent' in props && props.listComponent) {
		return React.createElement(props.listComponent, {
			...props.listProps,
			accessor: props.accessor,
			children: props.children,
		})
	}
	return (
		<>
			{props.accessor.getFilteredEntities().map(entity => {
				if ('entityComponent' in props && props.entityComponent) {
					return (
						<SingleEntity
							key={entity.key}
							accessor={entity}
							entityComponent={props.entityComponent}
							entityProps={props.entityProps}
						>
							{props.children}
						</SingleEntity>
					)
				}
				return (
					<SingleEntity key={entity.key} accessor={entity}>
						{props.children}
					</SingleEntity>
				)
			})}
		</>
	)
}
EntityList.displayName = 'EntityList'
