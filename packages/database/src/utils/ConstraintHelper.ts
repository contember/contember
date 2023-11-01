import { Client } from '../client'
import { wrapIdentifier } from './sql'
import { DatabaseMetadata } from '../metadata'


export type ConstraintType = 'foreignKey' | 'unique'

export class ConstraintHelper {
	private level: Record<ConstraintType, number> = { unique: 0, foreignKey: 0 }

	constructor(
		private readonly client: Client,
		private readonly metadata: DatabaseMetadata,
	) {}

	public areConstraintsDeferred(type: ConstraintType): boolean {
		return this.level[type] > 0
	}

	public async setConstraintsDeferred(type: ConstraintType): Promise<void> {
		this.level[type]++
		if (this.level[type] > 1) {
			return
		}
		return await this.setConstraintsPolicy(type, 'DEFERRED')
	}

	public async setConstraintsImmediate(type: ConstraintType): Promise<void> {
		this.level[type]--
		if (this.level[type] > 0) {
			return
		}
		return await this.setConstraintsPolicy(type, 'IMMEDIATE')
	}

	private async setConstraintsPolicy(type: ConstraintType, policy: 'DEFERRED' | 'IMMEDIATE') {
		const constraints = await this.formatConstraints(type)
		if (constraints === null) {
			return
		}
		await this.client.query(`SET CONSTRAINTS ${constraints} ${policy}`)
	}

	private async formatConstraints(type: ConstraintType): Promise<string | null> {
		const constraints = type === 'unique' ? this.metadata.uniqueConstraints : this.metadata.foreignKeys
		const names = constraints.filter({ deferrable: true }).getNames()
		return names.length === 0 ? null : names.map(it => `${wrapIdentifier(this.client.schema)}.${wrapIdentifier(it)}`).join(', ')
	}
}
