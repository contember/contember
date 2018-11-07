interface DataBuilder<D> {
	data: D
}

namespace DataBuilder {
	export type DataLike<D, B extends DataBuilder<D>, B2 extends DataBuilder<any> = B> = D | B | ((builder: B2) => B)

	export const resolveData = <D, B extends DataBuilder<D>, B2 extends DataBuilder<any> = B>(
		data: DataLike<D, B, B2>,
		builderConstructor: { new (): B2 }
	): D => {
		if (data instanceof builderConstructor) {
			data = data.data
		} else if (data instanceof Function) {
			data = data(new builderConstructor()).data
		}
		return data as D
	}
}

export default DataBuilder
