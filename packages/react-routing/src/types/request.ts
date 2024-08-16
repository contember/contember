import { RoutingParameter } from '../dto/RoutingParameter'
import { SelectedDimension } from './dimensions'

export type RequestParameterValue = number | string

export type RequestParameters<Extra extends RoutingParameter = never> = {
	[K in string]?: RequestParameterValue | Extra
}

export interface PageRequest<P extends RequestParameters<RoutingParameter> = RequestParameters> {
	pageName: string
	parameters: P
	dimensions: SelectedDimension
}

export type RequestState<Parameters extends RequestParameters<RoutingParameter> = RequestParameters> = PageRequest<Parameters> | null

export type RequestChange = (currentState: RequestState) => IncompleteRequestState | string
export type DynamicRequestParameters = RequestParameters<RoutingParameter>
export type IncompleteRequestState = Partial<RequestState<DynamicRequestParameters>> & { pageName: string } | null


export interface RequestChangeEvent {
	readonly request: RequestState
	readonly abortNavigation: () => void
}

export type RequestChangeHandler = (event: RequestChangeEvent) => void
export type RoutingParameterResolver = (name: string) => RequestParameterValue | undefined
export type RoutingLinkTarget = string | RequestChange | IncompleteRequestState

