import { Client, Connection, Literal, LockModifier, LockType, Operator, SelectBuilder, UpdateBuilder } from '@contember/database'
import { EventRow, HandledEvent } from './types.js'
import { Actions } from '@contember/schema'
import { eventsToProcessSpecification, eventsToProcessStateSpecification } from '../model/EventsToProcessSpecification.js'
import { notify } from '../utils/notifyChannel.js'
import { Logger } from '@contember/logger'

const ACK_TIMEOUT_MS = 1_000 * 60 * 10 // 10 minutes
const DEFAULT_REPEAT_INTERVAL_MS = 5_000 // 5 seconds
const DEFAULT_MAX_ATTEMPTS = 10
const DEFAULT_BATCH_SIZE = 1
/** How long a target with an undefined variable is held back before it is checked again without a variable change. */
const UNDEFINED_VARIABLE_RECHECK_MS = 1_000 * 60 * 10 // 10 minutes
/** The last log entry of an event held by {@link EventsRepository.holdForUndefinedVariables}. */
const heldMarkerCondition = `log -> -1 -> 'undefinedVariables' IS NOT NULL`

export class EventsRepository {
	public async fetchBatch(actions: Actions.Schema, db: Client, logger: Logger): Promise<FetchBatchResult> {
		// Events referencing a target that no longer exists in the schema are terminally failed and
		// skipped over; count them so the caller can report them as terminal failures.
		let unknownTargetFailed = 0
		while (true) {
			const primaryEvent = (await this.fetchInternal(db, 1))[0]
			if (!primaryEvent) {
				return { ok: false, backoffMs: await this.fetchBackOff(db), unknownTargetFailed }
			}
			const target = actions.targets[primaryEvent.target]
			if (!target) {
				if (await this.markFailedOnUnknownTarget(db, primaryEvent.target, primaryEvent.id)) {
					unknownTargetFailed++
					// Never retried: the schema has to name the target again before such an event can be delivered.
					logger.error('Action event failed permanently, its target is not in the schema', {
						eventId: primaryEvent.id,
						target: primaryEvent.target,
						trigger: primaryEvent.trigger,
					})
				}
				continue
			}
			const batchSize = (target.batchSize ?? DEFAULT_BATCH_SIZE) - 1
			// A batch is delivered to the primary event's target, so it may only take events of that target.
			const batch = batchSize > 0 ? await this.fetchInternal(db, batchSize, primaryEvent.target) : []
			return { ok: true, events: [primaryEvent, ...batch], target, unknownTargetFailed }
		}
	}

	private async fetchBackOff(db: Client): Promise<number | undefined> {
		const result = await SelectBuilder.create<{ ms: number }>()
			.from('actions_event')
			.match(eventsToProcessStateSpecification)
			.select(it => it.raw('ceil(extract(epoch from visible_at - now()) * 1000)'), 'ms')
			.orderBy('visible_at', 'asc')
			.limit(1)
			.getResult(db)

		return result.length ? Math.max(0, result[0].ms) : undefined
	}

	private async fetchInternal(db: Client, limit: number, targetName?: string): Promise<EventRow[]> {
		const visibleAt = new Date()
		visibleAt.setTime(visibleAt.getTime() + ACK_TIMEOUT_MS)
		return await UpdateBuilder.create()
			.table('actions_event')
			.with('events', qb =>
				qb
					.select(it => it.raw('*'))
					.from('actions_event')
					.match(eventsToProcessSpecification)
					.where(targetName ? { target: targetName } : {})
					.limit(limit)
					.lock(LockType.forNoKeyUpdate, LockModifier.skipLocked))
			.values<EventRow>({
				state: 'processing',
				last_state_change: new Date(),
				visible_at: visibleAt,
			})
			.from(it => it.from('events').where(it => it.columnsEq(['events', 'id'], ['actions_event', 'id'])))
			.returning<EventRow>(new Literal('*'))
			.execute(db)
	}

	public async persistProcessed(db: Client, events: HandledEvent[], logger: Logger): Promise<PersistProcessedResult> {
		return await db.transaction(async trx => {
			await trx.query(Connection.REPEATABLE_READ)
			const succeed = events.filter(it => it.result.ok)
			await this.markSucceed(trx, succeed.map(it => it.row))

			let retried = 0
			let failed = 0
			for (const event of events) {
				if (!event.result.ok) {
					const terminal = await this.markFailed(trx, event)
					if (terminal) {
						failed++
						// Nothing else reports a given-up event; the target is named, never described by URL or headers.
						logger.error('Action event failed permanently, no attempts left', {
							eventId: event.row.id,
							target: event.row.target,
							trigger: event.row.trigger,
							attempts: event.row.num_retries + 1,
							code: event.result.code,
							errorMessage: event.result.errorMessage,
						})
					} else {
						retried++
					}
				}
			}
			return { succeeded: succeed.length, retried, failed }
		})
	}

	/**
	 * Holds back the due events of a target that interpolates an undefined variable, the given batch included,
	 * without spending an attempt. Events arriving while the target is held join that hold, so a target is checked
	 * again once per interval and each check rewrites only what came due. {@link resumeHeldForUndefinedVariables}
	 * releases them all once variables change.
	 */
	public async holdForUndefinedVariables(db: Client, { target, batch, variables }: {
		target: string
		batch: string[]
		variables: readonly string[]
	}): Promise<HoldResult> {
		const now = new Date()
		const entry = JSON.stringify({ ok: false, errorMessage: `Undefined variable ${variables.join(', ')}`, undefinedVariables: variables })
		return await db.transaction(async trx => {
			const current = await SelectBuilder.create<{ visible_at: Date }>()
				.from('actions_event')
				.select('visible_at')
				.where(it =>
					it
						.in('state', ['created', 'retrying'])
						.compare('target', Operator.eq, target)
						.compare('visible_at', Operator.gt, now)
						.raw(heldMarkerCondition)
				)
				.orderBy('visible_at')
				.limit(1)
				.getResult(trx)
			const until = current[0]?.visible_at ?? new Date(now.getTime() + UNDEFINED_VARIABLE_RECHECK_MS)
			await this.requeue(trx, batch, until)
			const held = await UpdateBuilder.create()
				.table('actions_event')
				.values<EventRow>({
					visible_at: until,
					// a re-check that finds the same variables missing does not grow the log
					log: it => it.raw('CASE WHEN log -> -1 = ?::jsonb THEN log ELSE log || ?::jsonb END', entry, entry),
				})
				.where(it =>
					it
						.in('state', ['created', 'retrying'])
						.compare('target', Operator.eq, target)
						.or(it => it.in('id', batch).compare('visible_at', Operator.lte, now))
				)
				.execute(trx)
			return { held, joined: current.length > 0 }
		})
	}

	/** Makes events held by {@link holdForUndefinedVariables} due now. Returns how many were released. */
	public async resumeHeldForUndefinedVariables(db: Client): Promise<number> {
		const now = new Date()
		return await UpdateBuilder.create()
			.table('actions_event')
			.values<EventRow>({
				visible_at: now,
			})
			.where(it =>
				it
					.in('state', ['created', 'retrying'])
					.compare('visible_at', Operator.gt, now)
					.raw(heldMarkerCondition)
			)
			.execute(db)
	}

	public async requeue(db: Client, events: string[], visibleAt: Date = new Date()): Promise<void> {
		await UpdateBuilder.create()
			.table('actions_event')
			.values<EventRow>({
				state: it =>
					it.raw(
						`
					CASE 
					WHEN num_retries = 0 THEN 
						?::__SCHEMA__.actions_trigger_state 
					ELSE 
					?::__SCHEMA__.actions_trigger_state END
				`,
						'created',
						'retrying',
					),
				last_state_change: new Date(),
				visible_at: visibleAt,
			})
			.where(it => it.in('id', events))
			.execute(db)
	}

	public async markStopped(db: Client, events: string[]): Promise<void> {
		await UpdateBuilder.create()
			.table('actions_event')
			.values<EventRow>({
				state: 'stopped',
				last_state_change: new Date(),
				resolved_at: new Date(),
			})
			.where(it => it.in('id', events))
			.execute(db)
	}

	private async markSucceed(db: Client, rows: EventRow[]): Promise<void> {
		const now = new Date()
		await UpdateBuilder.create()
			.table('actions_event')
			.values<EventRow>({
				state: 'succeed',
				num_retries: it => it.raw('num_retries + 1'),
				resolved_at: now,
				last_state_change: now,
			})
			.where(it => it.in('id', rows.map(it => it.id)))
			.execute(db)
	}

	/** Returns `true` when the event reached a terminal `failed` state, `false` when it will be retried. */
	private async markFailed(db: Client, event: HandledEvent): Promise<boolean> {
		const numRetries = event.row.num_retries + 1
		const now = new Date()
		const nextAttempt = new Date()
		nextAttempt.setTime(
			nextAttempt.getTime() + (event.target?.initialRepeatIntervalMs ?? DEFAULT_REPEAT_INTERVAL_MS) * Math.pow(2, event.row.num_retries),
		)
		const terminal = numRetries >= (event.target?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS)
		await UpdateBuilder.create()
			.table('actions_event')
			.values<EventRow>({
				last_state_change: now,
				num_retries: numRetries,
				log: JSON.stringify([...event.row.log, event.result]) as any,
				...(terminal
					? {
						state: 'failed',
					}
					: {
						state: 'retrying',
						visible_at: nextAttempt,
					}),
			})
			.where({ id: event.row.id })
			.execute(db)
		return terminal
	}

	private async markFailedOnUnknownTarget(db: Client, targetName: string, primaryEventId: string): Promise<boolean> {
		const affectedRows = await UpdateBuilder.create()
			.table('actions_event')
			.where(it =>
				it.or(it =>
					it
						.and(it =>
							it
								.in('state', ['processing'])
								.compare('target', Operator.eq, targetName)
						)
						.and(it =>
							it
								.compare('id', Operator.eq, primaryEventId)
						)
				)
			)
			.values<EventRow>({
				// intentionally not retrying
				last_state_change: new Date(),
				num_retries: it => it.raw('num_retries + 1'),
				log: it => it.raw('log || ?::jsonb', { ok: false, errorMessage: `Event target ${targetName} not found, stopping.` }),
				state: 'failed',
				resolved_at: new Date(),
			})
			.execute(db)
		return affectedRows > 0
	}
}

export type FetchBatchResult =
	| { ok: true; events: EventRow[]; target: Actions.AnyTarget; unknownTargetFailed: number }
	| { ok: false; backoffMs?: number; unknownTargetFailed: number }

export type HoldResult = {
	/** Events held by this call. */
	held: number
	/** The target was already held, these events joined that hold. */
	joined: boolean
}

export type PersistProcessedResult = {
	/** Events delivered successfully (terminal). */
	succeeded: number
	/** Events whose delivery attempt failed and that will be retried later. */
	retried: number
	/** Events whose delivery attempt failed and that reached a terminal `failed` state. */
	failed: number
}
