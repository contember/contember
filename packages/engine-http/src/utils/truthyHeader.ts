import { IncomingMessage } from 'node:http'

const truthyValues = new Set(['1', 'true', 'on', 'yes'])

export const isTruthyHeader = (request: IncomingMessage, header: string): boolean => {
	const raw = request.headers[header]
	const value = Array.isArray(raw) ? raw[0] : raw
	if (value === undefined) {
		return false
	}
	return truthyValues.has(value.trim().toLowerCase())
}
