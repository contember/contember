import { Connection, EventManager } from '@contember/database'
import { Attributes, Span, Tracer } from '@contember/telemetry'

export interface SqlSpanLabels {
	module: string
	project: string
	projectGroup: string
	instance: 'single' | 'primary' | 'replica'
}

export interface SqlSpansOptions {
	includeQueryText: boolean
}

type Unregistrar = () => void
export type SqlSpansRegistrar = (connection: Connection.Queryable, labels: SqlSpanLabels) => Unregistrar

const operationName = (sql: string): string => {
	const keyword = /^\s*([a-zA-Z]+)/.exec(sql)
	return keyword === null ? 'SQL' : keyword[1].toUpperCase()
}

export const createSqlSpansRegistrar = (tracer: Tracer, { includeQueryText }: SqlSpansOptions): SqlSpansRegistrar => {
	// PR 2 guarantees start/end/error share the query object, so it can pair the two halves
	const spans = new WeakMap<Connection.Query, Span>()

	return (connection, labels) => {
		const queryStartCallback: EventManager.ListenerTypes[EventManager.Event.queryStart] = query => {
			if (tracer.activeSpanContext() === undefined) {
				return
			}
			const attributes: Attributes = {
				'db.system': 'postgresql',
				'contember.module': query.meta.module || labels.module,
				'contember.project': labels.project,
				'contember.project_group': labels.projectGroup,
				'contember.db_instance': labels.instance,
			}
			if (includeQueryText) {
				attributes['db.query.text'] = query.sql
			}
			spans.set(query, tracer.startSpan(operationName(query.sql), { kind: 'client', attributes }))
		}
		const queryEndCallback: EventManager.ListenerTypes[EventManager.Event.queryEnd] = (query, { timing }) => {
			const span = spans.get(query)
			if (span === undefined) {
				return
			}
			spans.delete(query)
			if (timing !== undefined) {
				span.setAttribute('db.contember.execution_ms', timing.selfDuration / 1000)
			}
			span.end()
		}
		const queryErrorCallback: EventManager.ListenerTypes[EventManager.Event.queryError] = (query, error) => {
			const span = spans.get(query)
			if (span === undefined) {
				return
			}
			spans.delete(query)
			span.recordException(error)
			span.setStatus('error', error.message)
			span.end()
		}

		connection.eventManager.on(EventManager.Event.queryStart, queryStartCallback)
		connection.eventManager.on(EventManager.Event.queryEnd, queryEndCallback)
		connection.eventManager.on(EventManager.Event.queryError, queryErrorCallback)

		return () => {
			connection.eventManager.removeListener(EventManager.Event.queryStart, queryStartCallback)
			connection.eventManager.removeListener(EventManager.Event.queryEnd, queryEndCallback)
			connection.eventManager.removeListener(EventManager.Event.queryError, queryErrorCallback)
		}
	}
}
