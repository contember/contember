import * as React from 'react'
import EnforceSubtypeRelation from '../coreComponents/EnforceSubtypeRelation'
import { ReferenceMarkerProvider } from '../coreComponents/MarkerProvider'
import ToMany, { ToManyProps } from '../coreComponents/ToMany'
import EntityMarker from '../dao/EntityMarker'
import ReferenceMarker from '../dao/ReferenceMarker'

export interface RepeaterProps extends ToManyProps {}

export default class Repeater extends React.Component<RepeaterProps> {
	static displayName = 'Repeater'

	public render() {
		return (
			<ul>
				<ToMany {...this.props}>
					<li>{this.props.children}</li>
				</ToMany>
			</ul>
		)
	}

	public static generateReferenceMarker(props: RepeaterProps, referredEntity: EntityMarker): ReferenceMarker {
		return ToMany.generateReferenceMarker(props, referredEntity)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof Repeater, ReferenceMarkerProvider>
