export const getRejections = (results: PromiseSettledResult<any>[]): any[] => {
	return results.filter((it): it is PromiseRejectedResult => it.status === 'rejected').map(it => it.reason)
}

export const getFulfilledValues = <T>(results: PromiseSettledResult<T>[]): T[] => {
	return results.filter((it): it is PromiseFulfilledResult<T> => it.status === 'fulfilled').map(it => it.value)
}
