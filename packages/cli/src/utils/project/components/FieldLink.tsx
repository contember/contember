import { Fragment, h } from 'preact'
import { EntityLink } from './EntityLink'
import { formatFieldAnchor } from './utils'

export const FieldLink = ({ entity, field, noEntityLabel }: { entity: string; field: string; noEntityLabel?: boolean }) => (
	<Fragment>
		{noEntityLabel ? '' : <Fragment><EntityLink entity={entity} />.</Fragment>}
		<a href={`#${formatFieldAnchor(entity, field)}`} class={'text-blue-500 hover:underline'}>{field}</a>
	</Fragment>
)
