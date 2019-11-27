import {
	EntityCreationParameters,
	SugarableEntityCreationParameters,
	UnsugarableEntityCreationParameters,
} from './EntityCreationParameters'
import {
	EntityTreeParameters,
	SugarableEntityTreeParameters,
	UnsugarableEntityTreeParameters,
} from './EntityTreeParameters'

export interface UnconstrainedEntityListTreeParameters extends EntityTreeParameters, EntityCreationParameters {}

export interface SugarableUnconstrainedEntityListTreeParameters
	extends SugarableEntityTreeParameters,
		SugarableEntityCreationParameters {}

export interface UnsugarableUnconstrainedEntityListTreeParameters
	extends UnsugarableEntityTreeParameters,
		UnsugarableEntityCreationParameters {}

// TODO sugar
