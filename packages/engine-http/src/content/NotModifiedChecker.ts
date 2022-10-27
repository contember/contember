import { DatabaseContext, LatestTransactionIdByStageQuery } from '@contember/engine-system-api'
import { Timer } from '../application'
import { IncomingMessage, ServerResponse } from 'http'


const NotModifiedHeaderName = 'x-contember-ref'

export interface NotModifiedCheckResult {
	isModified: boolean
	setResponseHeader: (response: ServerResponse) => void
}

export class NotModifiedChecker {
	public async checkNotModified({ request, body, timer, systemDatabase, stageId }: {
		body: any
		request: IncomingMessage
		timer: Timer
		systemDatabase: DatabaseContext
		stageId: string
	}): Promise<NotModifiedCheckResult | null> {
		if (request.headers[NotModifiedHeaderName] === undefined) {
			return null
		}
		const requestRef = request.headers[NotModifiedHeaderName]
		const isMutation = typeof body === 'object' && body !== null && 'query' in body && String(body.query).includes('mutation')
		if (isMutation) {
			return null
		}
		const latestRef = await timer('NotModifiedCheck', () => {
			const queryHandler = systemDatabase.queryHandler
			return queryHandler.fetch(new LatestTransactionIdByStageQuery(stageId))
		})

		return {
			isModified: latestRef !== requestRef,
			setResponseHeader: res => {
				if (res.statusCode === 200) {
					res.setHeader(NotModifiedHeaderName, latestRef)
				}
			},
		}
	}
}
