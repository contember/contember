import { Acl } from '@contember/schema'
import { Client } from '@contember/database'
import { Container } from '@contember/dic'
import { ExecutionContainer } from './resolvers/index.js'

export interface Context {
	db: Client
	identityVariables: Acl.VariablesMap
	executionContainer: Container<ExecutionContainer>
	timer: <T>(event: string, cb?: () => T) => Promise<T>
}
