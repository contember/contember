export const arrayDifference = <T>(minuend: T[], subtrahend: T[]): T[] =>
	minuend.filter(item => subtrahend.indexOf(item) === -1)
