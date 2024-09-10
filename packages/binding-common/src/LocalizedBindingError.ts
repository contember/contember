import type {
	EntityListSubTreeMarker,
	EntitySubTreeMarker,
	HasManyRelationMarker,
	HasOneRelationMarker,
	MeaningfulMarker,
} from './markers'
import { BindingError } from './BindingError'

export class LocalizedBindingError extends BindingError {
	public constructor(message: string, public readonly markerPath: MeaningfulMarker[]) {
		super(message)
	}

	public nestedIn(
		wrapper: EntitySubTreeMarker | EntityListSubTreeMarker | HasOneRelationMarker | HasManyRelationMarker,
	): LocalizedBindingError {
		return new LocalizedBindingError(this.message, [wrapper, ...this.markerPath])
	}
}
