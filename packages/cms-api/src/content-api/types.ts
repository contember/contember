import { Acl } from '@contember/schema'
import { Client } from '@contember/database'
import ReadResolver from './graphQlResolver/ReadResolver'
import MutationResolver from './graphQlResolver/MutationResolver'
import Container from '../core/di/Container'
import ErrorHandlerExtension from '../core/graphql/ErrorHandlerExtension'
import TimerMiddlewareFactory from '../http/TimerMiddlewareFactory'
import { ExecutionContainer } from './graphQlResolver/ExecutionContainerFactory'

export interface Context {
	db: Client
	identityVariables: Acl.VariablesMap
	executionContainer: Container<ExecutionContainer>
	errorHandler: ErrorHandlerExtension.Context['errorHandler']
	timer: TimerMiddlewareFactory.KoaState['timer']
}
