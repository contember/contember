import { DynamicRequestParameters, RequestParameters, RoutingParameterResolver } from '../../types/index.js'
import { RoutingParameter } from '../../dto/RoutingParameter.js'

export const resolveParameters = (parameters: DynamicRequestParameters, resolveParameter: RoutingParameterResolver): RequestParameters => {
	return Object.fromEntries(
		Object.entries(parameters).map(([name, value]) => {
			if (value instanceof RoutingParameter) {
				return [name, resolveParameter(value.name)]
			}
			return [name, value]
		}),
	)
}
