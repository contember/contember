import { RoutingLinkTarget } from '../types'
import { Environment, QueryLanguage } from '@contember/react-binding'
import { RoutingParameter } from '../RoutingParameter'

export type LinkTarget = RoutingLinkTarget

export const parseLinkTarget = (to: LinkTarget, env: Environment): Exclude<LinkTarget, string> => {
	if (typeof to !== 'string') {
		return to
	}
	const parsedTarget = QueryLanguage.desugarTaggedMap(to, env)
	return {
		pageName: parsedTarget.name,
		parameters: Object.fromEntries(parsedTarget.entries.map(it => {
			switch (it.value.type) {
				case 'literal':
					return [it.key, typeof it.value.value === 'number' ? String(it.value.value) : it.value.value ?? undefined]
				case 'variable':
					return [it.key, new RoutingParameter(it.value.value)]
			}
		})),
	}
}
