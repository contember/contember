import { Input } from '@contember/schema'

export class DeletedEntitiesStorage {
	private deleted = new Set<string>()

	public markDeleted(entityName: string, primary: Input.PrimaryValue): void {
		this.deleted.add(this.getKey(entityName, primary))
	}

	public merge(storage: DeletedEntitiesStorage) {
		for (const key of storage.deleted) {
			this.deleted.add(key)
		}
	}

	public isDeleted(entityName: string, primary: Input.PrimaryValue): boolean {
		return this.deleted.has(this.getKey(entityName, primary))
	}

	private getKey(entityName: string, primary: Input.PrimaryValue): string {
		return `${entityName}#${primary}`
	}
}
