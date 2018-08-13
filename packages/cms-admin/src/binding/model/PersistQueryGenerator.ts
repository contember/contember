import RootEntityMarker from '../dao/RootEntityMarker'

export default class PersistQueryGenerator {
	public constructor(private persistedData: object, private currentData: RootEntityMarker) {}

	public generatePersistQuery(): string {
		return ''
	}
}
