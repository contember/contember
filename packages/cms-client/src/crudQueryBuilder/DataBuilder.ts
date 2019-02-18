import { isEmptyObject } from 'cms-common'

interface DataBuilder<D> {
	data: D
}

namespace DataBuilder {
	export type DataLike<D, B extends DataBuilder<D>, B2 extends DataBuilder<any> = B> = D | B | ((builder: B2) => B)

	export const resolveData = <D, B extends DataBuilder<D>, B2 extends DataBuilder<any> = B>(
		data: DataLike<D, B, B2>,
		builderConstructor: { new (): B2 }
	): D | undefined => {
		if (data instanceof builderConstructor) {
			data = data.data
		} else if (data instanceof Function) {
			data = data(new builderConstructor()).data
		}
		const resolvedData: D = data as D

		if (Array.isArray(resolvedData) && resolvedData.length === 0) {
			return undefined
		}
		if (typeof resolvedData === 'object' && resolvedData !== null && isEmptyObject(resolvedData)) {
			return undefined
		}
		return resolvedData
	}
}

export default DataBuilder
