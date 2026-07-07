import { ScheduledJob } from './types.js'

/**
 * Process-global registry of scheduled jobs. Job definitions are code (not per-tenant), so a single
 * instance is shared: the scheduler plugin owns it and hands it to dependent plugins (e.g. retention),
 * which call {@link register} — see `engine-server` `loadPlugins` wiring. The per-project scheduler
 * loop reads {@link list} on every tick, so jobs registered after the plugins are constructed (before
 * workers start) are picked up.
 */
export class ScheduledJobRegistry {
	private readonly jobs = new Map<string, ScheduledJob>()

	public register(job: ScheduledJob): void {
		if (this.jobs.has(job.name)) {
			throw new Error(`Scheduled job "${job.name}" is already registered.`)
		}
		this.jobs.set(job.name, job)
	}

	public list(): readonly ScheduledJob[] {
		return [...this.jobs.values()]
	}

	public has(name: string): boolean {
		return this.jobs.has(name)
	}
}
