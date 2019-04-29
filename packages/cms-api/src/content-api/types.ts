import { Acl } from 'cms-common'
import Client from '../core/database/Client'
import ReadResolver from './graphQlResolver/ReadResolver'
import MutationResolver from './graphQlResolver/MutationResolver'
import Container from '../core/di/Container'
import ErrorHandlerExtension from '../core/graphql/ErrorHandlerExtension'
import TimerMiddlewareFactory from '../http/TimerMiddlewareFactory'

export interface Context {
	db: Client
	identityVariables: Acl.VariablesMap
	executionContainer: Container<{ readResolver: ReadResolver; mutationResolver: MutationResolver }>
	errorHandler: ErrorHandlerExtension.Context['errorHandler']
	timer: TimerMiddlewareFactory.KoaState['timer']
}
