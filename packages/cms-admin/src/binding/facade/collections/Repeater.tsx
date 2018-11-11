import * as React from 'react'
import { DataContext, EnforceSubtypeRelation, ReferenceMarkerProvider, ToMany, ToManyProps } from '../../coreComponents'
import { EntityAccessor, EntityCollectionAccessor, EntityFields, ReferenceMarker } from '../../dao'
import { AddNewButton, UnlinkButton } from '../buttons'

export interface RepeaterProps extends ToManyProps {}

export class Repeater extends React.Component<RepeaterProps> {
	static displayName = 'Repeater'

	public render() {
		return (
			<ToMany.CollectionRetriever {...this.props}>
				{(field: EntityCollectionAccessor) => {
					return (
						<>
							{field.entities.map(
								(datum, i) =>
									datum instanceof EntityAccessor && (
										<DataContext.Provider value={datum} key={i}>
											{this.props.children}
											<UnlinkButton />
										</DataContext.Provider>
									)
							)}
							<AddNewButton addNew={field.addNew} />
						</>
					)
				}}
			</ToMany.CollectionRetriever>
		)
	}

	public static generateReferenceMarker(props: RepeaterProps, fields: EntityFields): ReferenceMarker {
		return ToMany.generateReferenceMarker(props, fields)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof Repeater, ReferenceMarkerProvider>
