import { isDeepStrictEqual } from 'util'

import { Acl, Input, Model, Writable } from '@contember/schema'
import { PredicateDefinitionProcessor } from '@contember/schema-utils'

import { PermissionsByEntity } from './AclFactory'
import { createPredicateName } from './createPredicateName'
import { AllowDefinition, PredicateExtra, WhenDefinition } from '../permissions'
import { PredicateEvaluationReference } from '../references'
import { EntityVariableDefinition } from '../variables'

export class EntityPredicatesResolver {
	private usedPredicates: string[] = []

	private constructor(
		private aclDefinitions: AllowDefinition<any>[],
		private _predicates: Writable<Acl.PredicateMap>,
		private predicateNamesMap: Map<WhenDefinition, string>,
		private generatedNames: Set<string>,
	) {
	}

	public static create(
		rolePermissions: PermissionsByEntity,
		model: Model.Schema,
		entity: Model.Entity,
	): EntityPredicatesResolver {
		const predicates: Writable<Acl.PredicateMap> = {}
		const predicateNamesMap = new Map<WhenDefinition, string>()
		const aclDefinitions = rolePermissions.get(entity.name)?.definitions ?? []
		const generatedNames = new Set<string>()
		for (const permission of aclDefinitions) {
			if (!permission.when) {
				continue
			}
			const resolvedPredicate = EntityPredicatesResolver.resolvePredicate(model, entity, permission.when, rolePermissions)
			let predicateName = permission.name ?? createPredicateName(resolvedPredicate)
			while (predicateName in predicates) {
				predicateName += '_'
			}
			predicates[predicateName] = resolvedPredicate
			predicateNamesMap.set(permission.when, predicateName)
		}
		return new EntityPredicatesResolver(aclDefinitions, predicates, predicateNamesMap, generatedNames)
	}

	createFieldPredicate(op: 'create' | 'update' | 'read' | 'delete', field: string): true | undefined | string {
		const fieldWhens = EntityPredicatesResolver.getMatchingWhens(this.aclDefinitions, op, field)
		if (fieldWhens.length === 0) {
			return undefined
		}
		if (fieldWhens.includes(true)) {
			return true
		}
		const predicateNames = (fieldWhens as WhenDefinition[]).map(it => {
			const name = this.predicateNamesMap.get(it)
			if (!name) throw new Error('implementation error')
			return name
		})
		if (predicateNames.length === 1) {
			this.usedPredicates.push(predicateNames[0])
			return predicateNames[0]
		}


		const predicate = { or: predicateNames.map(it => this._predicates[it]) }
		const predicateName = predicateNames.every(it => this.generatedNames.has(it)) ? createPredicateName(predicate) : predicateNames.join('_or_')
		if (!(predicateName in this._predicates)) {
			this._predicates[predicateName] = predicate
		} else if (!isDeepStrictEqual(predicate, this._predicates[predicateName])) {
			throw new Error('Duplicate predicate')
		}
		this.usedPredicates.push(predicateName)
		return predicateName
	}

	get predicates(): Acl.PredicateMap {
		return Object.fromEntries(Object.entries(this._predicates).filter(([name]) => this.usedPredicates.includes(name)))
	}


	private static resolvePredicate(
		model: Model.Schema,
		entity: Model.Entity,
		when: WhenDefinition,
		rolePermissionsByEntity: PermissionsByEntity,
	): Acl.PredicateDefinition {
		const processor = new PredicateDefinitionProcessor(model)
		return processor.process<Acl.PredicateReference | Input.Condition, PredicateExtra>(entity, when, {
			handleColumn(ctx) {
				if (ctx.value instanceof EntityVariableDefinition) {
					return ctx.value.name
				}
				if (ctx.value instanceof PredicateEvaluationReference) {
					throw `Not allowed on column`
				}
				return ctx.value
			},
			handleRelation(ctx) {
				if (ctx.value instanceof EntityVariableDefinition) {
					return { [ctx.targetEntity.primary]: ctx.value.name }
				}
				if (ctx.value instanceof PredicateEvaluationReference) {
					const targetPermissions = rolePermissionsByEntity.get(ctx.targetEntity.name)
					if (!targetPermissions) {
						return { [ctx.targetEntity.primary]: { never: true } }
					}
					const ref = ctx.value
					const whens = EntityPredicatesResolver.getMatchingWhens(targetPermissions.definitions, ref.operation, ref.field ?? '')
					if (whens.length === 0) {
						return { [ctx.targetEntity.primary]: { never: true } }
					}
					if (whens.includes(true)) {
						return { [ctx.targetEntity.primary]: { always: true } }
					}
					const predicates = (whens as WhenDefinition[]).map(it =>
						EntityPredicatesResolver.resolvePredicate(model, ctx.targetEntity, it, rolePermissionsByEntity),
					)
					if (predicates.length > 1) {
						return { or: predicates }
					}
					return predicates[0]
				}
				return ctx.value
			},
		})
	}

	private static getMatchingWhens(permissions: AllowDefinition<any>[], operation: 'delete' | 'read' | 'update' | 'create', field: string) {
		return permissions
			.filter(it => {
				if (operation === 'delete') {
					return !!it.delete
				}
				const op = it[operation]
				if (!op) {
					return false
				}
				return op === true || op.includes(field)
			})
			.map(it => it.when ?? true)
	}
}
