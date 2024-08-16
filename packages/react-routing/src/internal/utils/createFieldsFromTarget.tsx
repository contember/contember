import { LinkTarget } from './parseLinkTarget'
import { targetToRequest } from './targetToRequest'
import { ROUTING_BINDING_PARAMETER_PREFIX } from '../hooks/useBindingLinkParametersResolver'
import { DynamicRequestParameters } from '../../types'
import { RoutingParameter } from '../../dto'

export const createFieldsFromTarget = (to: LinkTarget) => {
	const dummyRequest = {
		dimensions: {},
		pageName: '',
		parameters: {},
	}
	const request = targetToRequest(to, dummyRequest)

	return collectDynamicParameters(request?.parameters ?? {})
		.filter(it => it.startsWith(ROUTING_BINDING_PARAMETER_PREFIX))
		.map(it => it.slice(ROUTING_BINDING_PARAMETER_PREFIX.length))
}
const collectDynamicParameters = (parameters: DynamicRequestParameters): string[] => {
	return Object.values(parameters)
		.flatMap(it => {
			if (it instanceof RoutingParameter) {
				return it.name
			}
			if (typeof it === 'object' && it !== null) {
				return collectDynamicParameters(it)
			}
			return null
		})
		.filter((it): it is string => it !== null)
}
