import * as React from 'react'
import { EntityListAccessor } from '../accessors'
import { Component } from './Component'
import { Entity, EntityBaseProps } from './Entity'

export interface EntityListBaseProps {
	accessor: EntityListAccessor
	children?: React.ReactNode
}

export type EntityListProps<ListProps, EntityProps> = EntityListBaseProps &
	(
		| {}
		| {
				entityComponent: React.ComponentType<EntityProps & EntityBaseProps>
				entityProps?: EntityProps
		  }
		| {
				listComponent: React.ComponentType<ListProps & EntityListBaseProps>
				listProps?: ListProps
		  }
	)

export const EntityList = Component(
	<ListProps, EntityProps>(props: EntityListProps<ListProps, EntityProps>) => {
		if ('listComponent' in props && props.listComponent) {
			return React.createElement(props.listComponent, {
				...props.listProps!,
				accessor: props.accessor,
				children: props.children,
			})
		}
		return (
			<>
				{Array.from(props.accessor, entity => {
					if ('entityComponent' in props && props.entityComponent) {
						return (
							<Entity
								key={entity.key}
								accessor={entity}
								entityComponent={props.entityComponent}
								entityProps={props.entityProps}
							>
								{props.children}
							</Entity>
						)
					}
					return (
						<Entity key={entity.key} accessor={entity}>
							{props.children}
						</Entity>
					)
				})}
			</>
		)
	},
	<ListProps, EntityProps>(props: EntityListProps<ListProps, EntityProps>) => {
		if ('listComponent' in props && props.listComponent) {
			return React.createElement(props.listComponent, {
				...props.listProps!,
				accessor: props.accessor,
				children: props.children,
			})
		}
		return <>{props.children}</>
	},
	'EntityList',
) as <ListProps, EntityProps>(props: EntityListProps<ListProps, EntityProps>) => React.ReactElement
