export const promiseAllObject = (promises: { [key: string]: PromiseLike<any> }) => {
	const promisesArr: Array<PromiseLike<any>> = []
	for (const key in promises) {
		promisesArr.push(promises[key].then(result => ({ key, result })))
	}
	return Promise.all(promisesArr).then((promiseResults: Array<{ key: string; result: any }>) => {
		const results: any = {}
		for (let i = 0; i < promiseResults.length; i++) {
			results[promiseResults[i].key] = promiseResults[i].result
		}
		return results
	})
}
