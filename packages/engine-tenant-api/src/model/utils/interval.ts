import { IPostgresInterval } from 'postgres-interval'

/**
 * Serializes an interval into a Postgres-acceptable string literal for use as a
 * query parameter (e.g. writing into an INTERVAL column). `postgres-interval`
 * instances expose `toPostgres()`; we fall back to a seconds literal otherwise.
 */
export const intervalToPostgres = (interval: IPostgresInterval): string => {
	if (typeof interval.toPostgres === 'function') {
		return interval.toPostgres()
	}
	return `${intervalToSeconds(interval)} seconds`
}

export const intervalToSeconds = (interval: IPostgresInterval): number => {
	const { months, years, days, hours, minutes, seconds, milliseconds } = interval
	return (
		(years || 0) * 365 * 24 * 60 * 60
		+ (months || 0) * 30 * 24 * 60 * 60
		+ (days || 0) * 24 * 60 * 60
		+ (hours || 0) * 60 * 60
		+ (minutes || 0) * 60
		+ (seconds || 0)
		+ (milliseconds || 0) / 1000
	)
}
