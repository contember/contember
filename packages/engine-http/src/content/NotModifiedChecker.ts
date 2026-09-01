import { DatabaseContext, LatestTransactionIdByStageQuery } from '@contember/engine-system-api'
import { Timer } from '../application/index.js'
import { IncomingMessage, ServerResponse } from 'node:http'
import { OperationTypeNode } from 'graphql'

const NotModifiedHeaderName = 'x-contember-ref'

export interface NotModifiedCheckResult {
	isModified: boolean
	setResponseHeader: (response: ServerResponse) => void
}

export class NotModifiedChecker {
	public async checkNotModified({ request, operation, timer, systemDatabase, stageId }: {
		request: IncomingMessage
		operation: OperationTypeNode
		timer: Timer
		systemDatabase: DatabaseContext
		stageId: string
	}): Promise<NotModifiedCheckResult | null> {
		if (operation !== OperationTypeNode.QUERY) {
			return null
		}
		if (request.headers[NotModifiedHeaderName] === undefined) {
			return null
		}
		const requestRef = request.headers[NotModifiedHeaderName]
		const latestRef = await timer('NotModifiedCheck', () => {
			const queryHandler = systemDatabase.queryHandler
			return queryHandler.fetch(new LatestTransactionIdByStageQuery(stageId))
		})

		// No content transaction found
		if (latestRef === null) {
			return null
		}

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
