import { LogLevelName } from './types'

export const LogLevels: { [K in LogLevelName]: { name: K; value: number } } = {
	debug: { name: 'debug', value: 10 },
	info: { name: 'info', value: 20 },
	warn: { name: 'warn', value: 30 },
	error: { name: 'error', value: 40 },
	crit: { name: 'crit', value: 50 },
}
