import { Client } from '../client'
import { wrapIdentifier } from './sql'

export class ConstraintHelper {
	private fkConstraintNames: string[] | null = null
	private fkConstraintsLevel = 0

	constructor(private readonly client: Client) {}

	public async setFkConstraintsDeferred(): Promise<void> {
		this.fkConstraintsLevel++
		if (this.fkConstraintsLevel > 1) {
			return
		}
		return await this.setFkConstraintsPolicy('DEFERRED')
	}

	public async setFkConstraintsImmediate(): Promise<void> {
		this.fkConstraintsLevel--
		if (this.fkConstraintsLevel > 0) {
			return
		}
		return await this.setFkConstraintsPolicy('IMMEDIATE')
	}

	private async setFkConstraintsPolicy(policy: 'DEFERRED' | 'IMMEDIATE') {
		const constraints = await this.formatConstraints()
		await this.client.query(`SET CONSTRAINTS ${constraints} ${policy}`)
	}

	private async formatConstraints(): Promise<string> {
		if (this.fkConstraintNames === null) {
			this.fkConstraintNames = (
				await this.client.query<{ name: string }>(
					`SELECT con.conname AS name
					FROM pg_catalog.pg_constraint con
					INNER JOIN pg_catalog.pg_namespace nsp ON nsp.oid = connamespace
					WHERE nsp.nspname = ? and con.condeferrable = true and contype = ?`,
					[this.client.schema, 'f'],
				)
			).rows.map(it => it.name)
		}
		return this.fkConstraintNames.map(it => `${wrapIdentifier(this.client.schema)}.${wrapIdentifier(it)}`).join(', ')
	}
}
