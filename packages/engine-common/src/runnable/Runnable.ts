import { Logger } from '@contember/logger'

export type RunnableArgs = {
	onError: (e: any) => void
	onClose?: () => void
	logger: Logger
}

export interface Runnable {
	run(args: RunnableArgs): Promise<Running>
}

export interface Running {
	end(): Promise<void>
}
