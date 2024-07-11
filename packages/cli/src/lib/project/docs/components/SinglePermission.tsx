import { h } from 'preact'
import { Acl } from '@contember/schema'

export const SinglePermission = ({ predicate, value }: { predicate?: Acl.Predicate; value: string }) => {
	if (!predicate) {
		return <span class={'bg-red-500 text-white font-semibold px-0.5'}>{value}</span>
	}
	if (predicate === true) {
		return <span class={'bg-green-600 text-white font-semibold px-0.5'}>{value}</span>
	}
	return <span class={'bg-yellow-400 text-black font-semibold px-0.5'} title={predicate}>{value}</span>
}

