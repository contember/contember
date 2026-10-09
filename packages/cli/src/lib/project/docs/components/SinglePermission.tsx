import { h } from 'preact'
import { Acl } from '@contember/schema'

const THROUGH_ONLY_TITLE = 'only through a relation'

export const SinglePermission = ({ predicate, value, throughOnly = false }: { predicate?: Acl.Predicate; value: string; throughOnly?: boolean }) => {
	if (!predicate) {
		return <span class={'bg-red-500 text-white font-semibold px-0.5'}>{value}</span>
	}
	const throughClass = throughOnly ? ' underline decoration-dotted' : ''
	if (predicate === true) {
		return (
			<span class={'bg-green-600 text-white font-semibold px-0.5' + throughClass} title={throughOnly ? THROUGH_ONLY_TITLE : undefined}>
				{value}
			</span>
		)
	}
	return (
		<span
			class={'bg-yellow-400 text-black font-semibold px-0.5' + throughClass}
			title={throughOnly ? `${predicate}, ${THROUGH_ONLY_TITLE}` : predicate}
		>
			{value}
		</span>
	)
}
