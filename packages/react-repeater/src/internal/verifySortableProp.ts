import { BindingError } from '@contember/binding'

export const verifySortableProp = (props: {sortableBy?: unknown; orderBy?: unknown}) => {
	if (
		'sortableBy' in props &&
		props.sortableBy !== undefined &&
		'orderBy' in props &&
		props.orderBy !== undefined
	) {
		throw new BindingError(`Incorrect <Repeater /> use: cannot supply both the 'orderBy' and the 'sortableBy' properties.
	- To allow the user to interactively order the items, use 'sortableBy'.
	- To control the order in which the items are automatically displayed, use 'orderBy'.`,
		)
	}
	if (!('sortableBy' in props) && !('orderBy' in props)) {
		throw new BindingError(`Using a <Repeater /> without either the 'orderBy' or the 'sortableBy' property. This will currently result in bad user experience as the items may shuffle unpredictably over time.
	- To allow the user to interactively order the items, use 'sortableBy'.
	- To control the order in which the items are automatically displayed, use 'orderBy'.
	- To disable this warning, set either of these to undefined.`,
		)
	}
}
