import { createWriteStream, WriteStream } from 'node:fs'
import { Logger } from '@contember/logger'

// a type, not an interface, so that it fits the config schema's JSON types
export type ContentRequestLogOptions = {
	/** Only these projects are recorded; there is no wildcard. */
	readonly projects: readonly string[]
	/** A JSON-lines file; the engine appends to it and creates it readable by its owner only. */
	readonly file: string
	/** Requests recorded per project by one engine process. */
	readonly maxRequests: number
	/** An ISO timestamp; nothing is recorded after it, in any process and after any restart. */
	readonly until: string
}

export interface ContentRequestLogEntry {
	/** Undefined for an engine that serves a single project group. */
	readonly projectGroup: string | undefined
	readonly project: string
	readonly stage: string
	readonly roles: readonly string[]
	readonly method: string
	/** The GraphQL request as the client sent it (the POST body or the GET query string). */
	readonly request: unknown
	/** The status the GraphQL handler produced, before `X-Contember-Force-Ok` coerces it. */
	readonly status: number
}

/** Ceiling of `maxRequests`, so that a typo cannot turn the sample into a full copy of the traffic. */
export const contentRequestLogMaxRequestsCeiling = 100_000

/** How far ahead `until` may lie when the engine starts, so that a forgotten configuration expires. */
export const contentRequestLogMaxUntilDays = 7

const closeTimeoutMs = 5000

/**
 * Records content API requests of selected projects, to replay them against a copy of the database before the
 * project changes its GraphQL engine. The variables carry client data, so the log is bounded by an absolute time
 * and by a count per process.
 */
export class ContentRequestLog {
	private readonly projects: ReadonlySet<string>
	private readonly counts = new Map<string, number>()
	private readonly until: number
	private stream: WriteStream | undefined
	private failed = false

	constructor(
		private readonly options: ContentRequestLogOptions,
		private readonly logger: Logger,
		private readonly now: () => number = Date.now,
	) {
		this.projects = new Set(options.projects)
		this.until = Date.parse(options.until)
	}

	public accepts(project: string): boolean {
		return !this.failed
			&& this.projects.has(project)
			&& (this.counts.get(project) ?? 0) < this.options.maxRequests
			&& this.now() < this.until
	}

	public record(entry: ContentRequestLogEntry): void {
		if (!this.accepts(entry.project)) {
			return
		}
		const count = (this.counts.get(entry.project) ?? 0) + 1
		this.counts.set(entry.project, count)
		const { request } = entry
		this.getStream().write(
			JSON.stringify({
				time: new Date(this.now()).toISOString(),
				projectGroup: entry.projectGroup ?? null,
				project: entry.project,
				stage: entry.stage,
				roles: entry.roles,
				method: entry.method,
				operationName: readField(request, 'operationName'),
				query: readField(request, 'query'),
				variables: readField(request, 'variables'),
				status: entry.status,
			}) + '\n',
		)
		if (count === this.options.maxRequests) {
			this.logger.warn('Content API request log reached its cap for a project', { project: entry.project, maxRequests: count })
		}
	}

	/** Flushes the recorded requests; called when the engine shuts down. */
	public async close(): Promise<void> {
		const stream = this.stream
		this.stream = undefined
		if (!stream) {
			return
		}
		if (this.failed) {
			stream.destroy()
			return
		}
		// a destination that stopped accepting data must not hold up the shutdown
		let timer: ReturnType<typeof setTimeout> | undefined
		const flushed = await Promise.race([
			new Promise<boolean>(resolve => stream.end(() => resolve(true))),
			new Promise<boolean>(resolve => {
				timer = setTimeout(() => resolve(false), closeTimeoutMs)
			}),
		])
		clearTimeout(timer)
		if (!flushed) {
			stream.destroy()
			this.logger.warn('Content API request log was not flushed in time; the last entries may be missing', { file: this.options.file })
		}
	}

	private getStream(): WriteStream {
		if (!this.stream) {
			this.logger.warn('Content API request log started recording request variables', {
				projects: this.options.projects,
				file: this.options.file,
				maxRequests: this.options.maxRequests,
				until: this.options.until,
			})
			const stream = createWriteStream(this.options.file, { flags: 'a', mode: 0o600 })
			stream.on('error', error => {
				// Recording must never fail a request; a broken destination stops the log instead.
				this.failed = true
				this.logger.error('Content API request log failed and is stopped', { error, file: this.options.file })
			})
			this.stream = stream
		}
		return this.stream
	}
}

const readField = (request: unknown, key: string): unknown =>
	typeof request === 'object' && request !== null && Object.hasOwn(request, key) ? Reflect.get(request, key) : undefined
