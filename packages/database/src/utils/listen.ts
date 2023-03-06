import { Client, Connection } from '../client'
import { wrapIdentifier } from './sql'
import { clearInterval } from 'node:timers'

type ListenArgs<P> = {
	client: Client<Connection.AcquiredConnectionLike>
	channel: string
	abortSignal?: AbortSignal
	healthCheckMs?: number
	onMessage: (payload: P) => void
	onError: (err: any) => void
	onClose?: () => void
}


export class Listener<P> {
	constructor(
		private readonly client: Client<Connection.AcquiredConnectionLike>,
		private readonly channel: string,
		private readonly onMessage: (message: P) => void,
		private readonly options: { healthCheckMs?: number } = {},
	) {
	}

	async run({ onClose, onError }: {
				  onError: (e: any) => void
				  onClose?: () => void
			  },
	): Promise<{ end: () => Promise<void> }> {
		let aborted = false
		let onAbortInner = async () => {}
		const onAbort = async () => {
			aborted = true
			await onAbortInner()
		}
		let cleanups: (() => void)[] = []
		const cleanup = () => {
			let localCleanup = cleanups
			cleanups = []
			localCleanup.forEach(it => it())
		}
		try {
			cleanups.push(this.client.connection.on('notification', ({ channel, payload }) => {
				if (channel !== this.channel || aborted) {
					return
				}
				this.onMessage(payload as P)
			}))
			await this.client.query(`LISTEN ${wrapIdentifier(this.channel)}`)

			;(async () => {
				const stopListening = async () => {
					try {
						await this.client.query(`UNLISTEN ${wrapIdentifier(this.channel)}`)
					} catch {
					}
				}

				try {
					if (aborted) {
						await stopListening()
						return
					}
					await new Promise<void>((resolve, reject) => {
						onAbortInner = async () => {
							await stopListening()
							resolve()
						}
						cleanups.push(this.client.connection.on('end', reject))
						cleanups.push(this.client.connection.on('error', reject))

						const healthCheckHandle = setInterval(async () => {
							try {
								await this.client.query('SELECT 1')
							} catch (e) {
								reject(e)
							}
						}, this.options.healthCheckMs ?? 30_000)
						cleanups.push(() => clearInterval(healthCheckHandle))
					})
					onClose?.()
				} catch (e) {
					onError(e)
				} finally {
					cleanup()
				}
			})()

			return {
				end: async () => {
					await onAbort()
				},
			}
		} catch (e) {
			cleanup()
			throw e
		}
	}
}


export class AcquiringListener<P> {
	constructor(
		private readonly client: Client,
		private readonly channel: string,
		private readonly onMessage: (message: P) => void,
		private readonly options: { healthCheckMs?: number } = {},
	) {
	}

	async run({ onClose, onError }: { onError: (e: any) => void;onClose?: () => void },
	): Promise<{ end: () => Promise<void> }> {
		return new Promise(async (resolveRunning, rejectRunning) => {
			try {
				await this.client.scope(async db => {
					const listener = new Listener<P>(db, this.channel, this.onMessage, this.options)
					await new Promise<void>(async (resolveScope, rejectScope) => {
						try {
							const running = await listener.run({
								onClose: resolveScope,
								onError: rejectScope,
							})
							resolveRunning({
								end: async () => {
									await running.end()
								},
							})
						} catch (e) {
							rejectScope(e)
						}
					})
				})
				onClose?.()
			} catch (e) {
				rejectRunning(e)
				onError(e)
			}
		})
	}
}
