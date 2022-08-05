import { DeletedEntitiesStorage } from './DeletedEntitiesStorage'
import { Input } from '@contember/schema'
import { ImplementationException } from '../../exception'
import { MutationResult, MutationResultList } from '../Result'

export class DeleteState {
	private plannedDelete = new DeletedEntitiesStorage()

	private plannedOrphanRemovals = new Map<string, Set<Input.PrimaryValue>>()
	private plannedOrphanRemovalsEntityQueue: string[] = []

	public result: MutationResultList = []
	public failResult: MutationResultList = []

	constructor(
		private alreadyDeleted: DeletedEntitiesStorage,
	) {
	}

	public isOk() {
		return this.failResult.length === 0
	}

	public getResult(): MutationResultList {
		return this.failResult.length > 0 ? this.failResult : this.result
	}

	public pushOkResult(result: MutationResultList | MutationResult) {
		this.result.push(...Array.isArray(result) ? result : [result])
	}

	public pushFailResult(result: MutationResultList | MutationResult) {
		this.failResult.push(...Array.isArray(result) ? result : [result])
	}


	public isPlannedDelete(entityName: string, primary: Input.PrimaryValue): boolean {
		return this.plannedDelete.isDeleted(entityName, primary)
	}

	public confirmDeleted() {
		this.alreadyDeleted.merge(this.plannedDelete)
		this.plannedDelete = new DeletedEntitiesStorage()
	}

	public markPlannedDelete(entityName: string, primaryValues: Input.PrimaryValue[]): void {
		for (const primary of primaryValues) {
			this.plannedDelete.markDeleted(entityName, primary)
		}
	}

	public addOrphanRemoval(entityName: string, primaryValues: Input.PrimaryValue[]): void {
		let entityIds = this.plannedOrphanRemovals.get(entityName)
		if (!entityIds) {
			entityIds = new Set()
			this.plannedOrphanRemovals.set(entityName, entityIds)
			this.plannedOrphanRemovalsEntityQueue.push(entityName)
		}
		for (const primary of primaryValues) {
			entityIds.add(primary)
		}
	}

	public fetchOrphanRemovals(): [entityName: string, ids: Input.PrimaryValue[]] | null {
		const entityName = this.plannedOrphanRemovalsEntityQueue.shift()
		if (!entityName) {
			return null
		}
		const ids = this.plannedOrphanRemovals.get(entityName)
		if (!ids) {
			throw new ImplementationException(`DeleteState.plannedOrphanRemovals is expected to have ${entityName}`)
		}
		this.plannedOrphanRemovals.delete(entityName)
		const idsToRemove = [...ids.values()].filter(it => !this.isPlannedDelete(entityName, it))
		if (idsToRemove.length > 0) {
			return [entityName, idsToRemove]
		}
		return this.fetchOrphanRemovals()
	}
}
