import { Stage } from '../../dtos'
import { DatabaseContext } from '../../database'
import { Schema } from '@contember/schema'
import { ExecutionResult } from 'graphql'
import { DatabaseMetadata } from '@contember/database'

export interface ContentQueryExecutorContext {
	schema: Schema & { id: number }
	identity: { id: string }
	db: DatabaseContext
	stage: Stage
	project: { slug: string; systemSchema: string }
	databaseMetadata: DatabaseMetadata
}

export interface ContentQueryExecutorQuery {
	query: string
	variables?: Record<string, any>
}

export interface ContentQueryExecutor {
	execute: (ctx: ContentQueryExecutorContext, query: ContentQueryExecutorQuery) => Promise<ContentQueryExecutorResult>
}

export type ContentQueryExecutorResult =
	| { ok: false; errors: string[] }
	| { ok: true; result: ExecutionResult }
