export const promiseAllObject = (promises: { [key: string]: PromiseLike<any> }) => {
  let promisesArr: PromiseLike<any>[] = []
  for (let key in promises) {
    promisesArr.push(promises[key].then(result => ({key: key, result})))
  }
  return Promise.all(promisesArr)
    .then((promiseResults: { key: string, result: any }[]) => {
      let results: any = {}
      for (let i = 0; i < promiseResults.length; i++) {
        results[promiseResults[i].key] = promiseResults[i].result
      }
      return results
    })
}
