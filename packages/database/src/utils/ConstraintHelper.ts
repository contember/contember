import { Client } from '../client'
import { wrapIdentifier } from './sql'


export type ConstraintType = 'foreignKey' | 'unique'

export class ConstraintHelper {
	private constraintNames: Record<ConstraintType, string[]> | null = null

	private level: Record<ConstraintType, number> = { unique: 0, foreignKey: 0 }

	constructor(private readonly client: Client) {}

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
		if (this.constraintNames === null) {
			const constraintsRows = (
				await this.client.query<{ name: string; type: 'f' | 'u' }>(
					`SELECT con.conname AS name, con.contype as type
					FROM pg_catalog.pg_constraint con
					INNER JOIN pg_catalog.pg_namespace nsp ON nsp.oid = connamespace
					WHERE nsp.nspname = ? and con.condeferrable = true and con.condeferred = false AND con.contype = ANY (ARRAY ['f', 'u'])`,
					[this.client.schema],
				)
			).rows
			this.constraintNames = { unique: [], foreignKey: [] }
			for (const row of constraintsRows) {
				if (row.type === 'f') {
					this.constraintNames.foreignKey.push(row.name)
				} else if (row.type === 'u') {
					this.constraintNames.unique.push(row.name)
				}
			}
		}
		if (this.constraintNames[type].length === 0) {
			return null
		}
		return this.constraintNames[type].map(it => `${wrapIdentifier(this.client.schema)}.${wrapIdentifier(it)}`).join(', ')
	}
}
