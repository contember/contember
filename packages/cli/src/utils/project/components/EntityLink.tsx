import { h } from 'preact'
import { formatEntityAnchor } from './utils'

export const EntityLink = ({ entity }: { entity: string }) => (
	<a href={`#${formatEntityAnchor(entity)}`} class={'text-blue-500 underline'}>{entity}</a>
)
