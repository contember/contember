import * as React from 'react'
import {
	DataContext,
	EnforceSubtypeRelation,
	Props,
	SyntheticChildrenProvider,
	ToMany,
	ToManyProps
} from '../../coreComponents'
import { EntityAccessor, EntityCollectionAccessor } from '../../dao'
import { AddNewButton, UnlinkButton } from '../buttons'

export interface RepeaterProps extends ToManyProps {}

class Repeater extends React.Component<RepeaterProps> {
	static displayName = 'Repeater'

	public render() {
		return (
			<ToMany.CollectionRetriever {...this.props}>
				{(field: EntityCollectionAccessor) => {
					return <Repeater.EntityCollection entities={field}>{this.props.children}</Repeater.EntityCollection>
				}}
			</ToMany.CollectionRetriever>
		)
	}

	public static generateSyntheticChildren(props: Props<RepeaterProps>): React.ReactNode {
		return <ToMany {...props}>{props.children}</ToMany>
	}
}

namespace Repeater {
	export interface ItemProps {
		entity: EntityAccessor
		displayUnlinkButton: boolean
	}

	export class Item extends React.PureComponent<ItemProps> {
		public render() {
			return (
				<DataContext.Provider value={this.props.entity}>
					{this.props.children}
					{this.props.displayUnlinkButton && <UnlinkButton />}
				</DataContext.Provider>
			)
		}
	}

	export interface EntityCollectionProps {
		entities: EntityCollectionAccessor
	}

	export class EntityCollection extends React.PureComponent<EntityCollectionProps> {
		public render() {
			const entities = filterEntities(this.props.entities)
			return (
				<>
					{entities.map(entity => (
						<Item displayUnlinkButton={entities.length > 1} entity={entity} key={entity.getKey()}>
							{this.props.children}
						</Item>
					))}
					<AddNewButton addNew={this.props.entities.addNew} />
				</>
			)
		}
	}

	export const filterEntities = (entities: EntityCollectionAccessor): EntityAccessor[] => {
		return entities.entities.filter((item): item is EntityAccessor => item instanceof EntityAccessor)
	}
}

export { Repeater }

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof Repeater, SyntheticChildrenProvider<RepeaterProps>>
