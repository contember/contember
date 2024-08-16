import { createContext, createRequiredContext } from '@contember/react-utils'
import { RequestChangeHandler, RequestState, RoutingContextValue } from './types'

const CurrentRequestContext_ = createRequiredContext<RequestState>('CurrentRequestContext')
/**
 * @internal
 */
export const CurrentRequestContext = CurrentRequestContext_[0]
export const useCurrentRequest = CurrentRequestContext_[1]

const PushRequestContext_ = createRequiredContext<(req: RequestState) => void>('PushRequestContext')
/**
 * @internal
 */
export const PushRequestContext = PushRequestContext_[0]
export const usePushRequest = PushRequestContext_[1]


const AddRequestListenerContext_ = createRequiredContext<(handler: RequestChangeHandler) => () => void>('AddRequestListenerContext')
/**
 * @internal
 */
export const AddRequestListenerContext = AddRequestListenerContext_[0]
export const useAddRequestChangeListener = AddRequestListenerContext_[1]


const RoutingContext_ = createContext<RoutingContextValue>('RoutingContext', { basePath: '/', routes: {} })
/**
 * @internal
 */
export const RoutingContext = RoutingContext_[0]
export const useRouting = RoutingContext_[1]
