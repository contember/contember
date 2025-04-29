import { IPostgresInterval } from 'postgres-interval'

export const intervalToSeconds = (interval: IPostgresInterval): number => {
	const { months, years,  days, hours, minutes, seconds, milliseconds } = interval
	return (
		(years || 0) * 365 * 24 * 60 * 60 +
		(months || 0) * 30 * 24 * 60 * 60 +
		(days || 0) * 24 * 60 * 60 +
		(hours || 0) * 60 * 60 +
		(minutes || 0) * 60 +
		(seconds || 0) +
		(milliseconds || 0) / 1000
	)
}
