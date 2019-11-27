import {
	EntityCreationParameters,
	SugarableEntityCreationParameters,
	UnsugarableEntityCreationParameters,
} from './EntityCreationParameters'
import {
	EntityListParameters,
	SugarableEntityListParameters,
	UnsugarableEntityListParameters,
} from './EntityListParameters'
import {
	EntityTreeParameters,
	SugarableEntityTreeParameters,
	UnsugarableEntityTreeParameters,
} from './EntityTreeParameters'

export interface EntityListTreeParameters
	extends EntityListParameters,
		EntityTreeParameters,
		EntityCreationParameters {}

export interface SugarableEntityListTreeParameters
	extends SugarableEntityListParameters,
		SugarableEntityTreeParameters,
		SugarableEntityCreationParameters {}

export interface UnsugarableEntityListTreeParameters
	extends UnsugarableEntityListParameters,
		UnsugarableEntityTreeParameters,
		UnsugarableEntityCreationParameters {}

// TODO sugar
