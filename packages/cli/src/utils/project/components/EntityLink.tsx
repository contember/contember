import { h } from 'preact'
import { formatEntityAnchor } from './utils.js'

export const EntityLink = ({ entity }: { entity: string }) => (
	<a href={`#${formatEntityAnchor(entity)}`} class={'text-blue-500 hover:underline'}>{entity}</a>
)
