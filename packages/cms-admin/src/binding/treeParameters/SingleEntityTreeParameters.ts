import {
	EntityTreeParameters,
	SugarableEntityTreeParameters,
	UnsugarableEntityTreeParameters,
} from './EntityTreeParameters'
import { SugaredUniqueWhere, UniqueWhere } from './primitives'
import {
	SingleEntityParameters,
	SugarableSingleEntityParameters,
	UnsugarableSingleEntityParameters,
} from './SingleEntityParameters'

export interface SingleEntityTreeParameters extends SingleEntityParameters, EntityTreeParameters {
	where: UniqueWhere
}

export interface SugarableSingleEntityTreeParameters
	extends SugarableSingleEntityParameters,
		SugarableEntityTreeParameters {
	where: SugaredUniqueWhere
}

export interface UnsugarableSingleEntityTreeParameters
	extends UnsugarableSingleEntityParameters,
		UnsugarableEntityTreeParameters {}

// TODO sugar
