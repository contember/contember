import { Acl, Model } from '@contember/schema'
import { Role } from './roles.js'
import { VariableDefinition } from './variables.js'
import { PredicateEvaluationReference } from './references.js'
import { allowDefinitionsStore } from './internal/stores.js'
import { DecoratorFunction, EntityConstructor } from '../../utils/index.js'

export type PredicateExtra = PredicateEvaluationReference | VariableDefinition
export type WhenDefinition = Acl.PredicateDefinition<PredicateExtra>

export interface AllowDefinition<E> {
	when?: WhenDefinition
	through?: true
	name?: string
	create?: true | ('id' | keyof E)[]
	update?: true | ('id' | keyof E)[]
	read?: true | ('id' | keyof E)[]
	delete?: true
}

export type AllowDefinitionFactory<E> = (args: {
	model: Model.Schema
	entity: Model.Entity<(keyof E) & string>
	except: (...fields: (keyof E)[]) => (keyof E)[]
}) => AllowDefinition<E>

export const allow = <E, R extends Role<string>>(role: R | R[], args: AllowDefinition<E> | AllowDefinitionFactory<E>): DecoratorFunction<E> => {
	return (entity: EntityConstructor<E>, context?: ClassDecoratorContext) => {
		;(Array.isArray(role) ? role : [role]).forEach(role => {
			allowDefinitionsStore.update(entity, val => [...val, {
				factory: typeof args === 'function' ? args : () => args,
				role,
			}], context)
		})
	}
}
