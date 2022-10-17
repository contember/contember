import { Acl } from '@contember/schema'
import { Client } from '@contember/database'
import { ExecutionContainer } from './ExecutionContainer'

export interface Context {
	db: Client
	identityVariables: Acl.VariablesMap
	executionContainer: ExecutionContainer
	timer: <T>(event: string, cb?: () => T) => Promise<T>
}
