import { assertNever, filterEntityDefinition } from '../../../utils'
import { Actions } from '@contember/schema'
import { triggersStore } from './store'
import { BasicTriggerDefinition, TargetDefinition, WatchTriggerDefinition } from '../triggers'
import { ActionsTarget } from '../targets'
import { Kind, parse, SelectionNode, ValueNode } from 'graphql'

export class ActionsFactory {
	constructor(
	) {
	}

	public create(
		exportedDefinitions: Record<string, any>,
	): Actions.Schema {
		const entityLikeDefinition = filterEntityDefinition(exportedDefinitions)

		const targetsRegistry = new ActionsTargetRegistry()
		for (const [exportedAs, def] of Object.entries(exportedDefinitions)) {
			if (!(def instanceof ActionsTarget)) {
				continue
			}
			const name = def.name ?? exportedAs
			targetsRegistry.register(name, def.definition)
		}

		const triggersDef = entityLikeDefinition.flatMap(([, entity]) => triggersStore.get(entity).map(it => ({
			...it,
			entity,
		})))

		const triggerNames = triggersDef.map(it => it.definition.name).filter((it): it is string => !!it)
		triggerNames.forEach((it, index, arr) => {
			if (arr.indexOf(it) !== index) {
				throw `Duplicate trigger name ${it}.`
			}
		})

		const triggers: Record<string, Actions.AnyTrigger> = {}
		for (const { definition, entity, type } of triggersDef) {
			const name = definition.name
			const target = this.resolveTarget(name, definition, targetsRegistry)
			let trigger: Actions.AnyTrigger
			if (type === 'basic') {
				trigger = {
					target,
					...this.createBasicTrigger(name, entity.name, definition),
				}
			} else if (type === 'watch') {
				trigger = {
					target,
					...this.createWatchTrigger(name, entity.name, definition),
				}
			} else {
				assertNever(type)
			}
			triggers[name] = trigger
		}


		return { triggers, targets: targetsRegistry.getTargets() }
	}

	private resolveTarget(triggerName: string, targetDefinition: TargetDefinition, targetRegistry: ActionsTargetRegistry): string {
		const generatedName = `${triggerName}_target`
		if ('target' in targetDefinition) {
			if (targetDefinition.target instanceof ActionsTarget) {
				const registeredName = targetRegistry.getName(targetDefinition.target.definition)
				if (!registeredName) {
					throw `Target of ${triggerName} trigger is not registered. Have you exported it?`
				}
				return registeredName
			} else {
				const { name, ...def } = targetDefinition.target
				const resolvedName = name ?? generatedName
				targetRegistry.register(resolvedName, { name: generatedName, ...def })
				return resolvedName
			}
		} else if ('webhook' in targetDefinition) {
			if (typeof targetDefinition.webhook === 'string') {
				targetRegistry.register(generatedName, {
					type: 'webhook',
					url: targetDefinition.webhook,
				})
			} else {
				targetRegistry.register(generatedName, {
					type: 'webhook',
					...targetDefinition.webhook,
				})
			}
			return generatedName
		}
		return assertNever(targetDefinition)
	}

	private createWatchTrigger(name: string, entity: string, trigger: WatchTriggerDefinition): Omit<Actions.WatchTrigger, 'target'> {
		return {
			type: 'watch',
			entity,
			name,
			watch: this.parseSelection(trigger.watch),
			selection: trigger.selection ? this.parseSelection(trigger.selection) : undefined,
		}
	}

	private createBasicTrigger(name: string, entity: string, trigger: BasicTriggerDefinition): Omit<Actions.BasicTrigger, 'target'> {
		return {
			type: 'basic',
			entity,
			name,
			create: trigger.create ?? false,
			delete: trigger.delete ?? false,
			update: trigger.update ?? false,
			selection: trigger.selection ? this.parseSelection(trigger.selection) : undefined,
		}
	}

	private parseSelection(selection: Actions.SelectionNode | string): Actions.SelectionNode {
		if (typeof selection !== 'string') {
			return selection
		}
		const result = parse(`{
			${selection}
		}`)
		for (const def of result.definitions) {
			if (def.kind === 'OperationDefinition') {
				return this.processSelectionSet(def.selectionSet.selections)
			}
		}
		throw new Error()
	}

	private processSelectionSet(selectionSet: readonly SelectionNode[]): Actions.SelectionNode {
		return selectionSet.map(it => {
			if (it.kind !== 'Field') {
				throw `${it.kind} is not supported.`
			}
			if (it.arguments?.length === 0 && it.selectionSet === undefined) {
				return it.name.value
			}
			const args = Object.fromEntries(it.arguments?.map(it => [it.name, parseArguments(it.value)]) ?? [])
			return [it.name.value, args, it.selectionSet ? this.processSelectionSet(it.selectionSet.selections) : []]
		})
	}
}

class ActionsTargetRegistry {
	private targets: Record<string, Actions.AnyTarget> = {}
	private targetsInverseMap = new Map<Omit<Actions.AnyTarget, 'name'>, string>()

	public register(name: string, target: Omit<Actions.AnyTarget, 'name'> & { name?: string }): void {
		if (this.targets[name]) {
			throw `Duplicate trigger target name ${name}`
		}
		this.targets[name] = { name, ...target }
		this.targetsInverseMap.set(target, name)
	}

	public getName(target: Omit<Actions.AnyTarget, 'name'>): string | undefined {
		return this.targetsInverseMap.get(target)
	}

	public getTargets() {
		return this.targets
	}
}

const parseArguments = (ast: ValueNode): any => {
	switch (ast.kind) {
		case Kind.STRING:
			return ast.value
		case Kind.BOOLEAN:
			return ast.value
		case Kind.FLOAT:
			return parseFloat(ast.value)
		case Kind.INT:
			return Number(ast.value)
		case Kind.LIST:
			return ast.values.map(it => parseArguments(it))
		case Kind.OBJECT:
			return Object.fromEntries(ast.fields.map(it => [it.name.value, parseArguments(it.value)]))
		case Kind.ENUM:
			return ast.value
		case Kind.NULL:
			return null
		case Kind.VARIABLE:
			throw `Variables are not supported here.`
	}
}
