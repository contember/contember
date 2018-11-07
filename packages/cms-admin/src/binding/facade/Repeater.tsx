import * as React from 'react'
import {
	DataContext,
	DataContextValue,
	EnforceSubtypeRelation,
	ReferenceMarkerProvider,
	ToMany,
	ToManyProps
} from '../coreComponents'
import {
	EntityAccessor,
	EntityCollectionAccessor,
	EntityFields,
	EntityForRemovalAccessor,
	ReferenceMarker
} from '../dao'
import { AddNewButton, UnlinkButton } from './buttons'

export interface RepeaterProps extends ToManyProps {}

export class Repeater extends React.Component<RepeaterProps> {
	static displayName = 'Repeater'

	public render() {
		return (
			<DataContext.Consumer>
				{(data: DataContextValue) => {
					if (data instanceof EntityAccessor) {
						const field = data.data.getField(
							this.props.field,
							ReferenceMarker.ExpectedCount.PossiblyMany,
							this.props.filter
						)

						if (field instanceof EntityCollectionAccessor) {
							return (
								<>
									{field.entities.map(
										(datum: EntityAccessor | EntityForRemovalAccessor | undefined, i: number) =>
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
						}
					}
				}}
			</DataContext.Consumer>
		)
	}

	public static generateReferenceMarker(props: RepeaterProps, fields: EntityFields): ReferenceMarker {
		return ToMany.generateReferenceMarker(props, fields)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof Repeater, ReferenceMarkerProvider>
