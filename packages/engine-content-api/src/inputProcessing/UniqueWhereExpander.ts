import { Input, Model, Writable } from '@contember/schema'
import { getTargetEntity } from '@contember/schema-utils'
import { UserError } from '../exception.js'
import { getFieldsForUniqueWhere } from '../utils/index.js'

type ExtendedUniqueWhere = Input.UniqueWhere<Input.PrimaryValue[]>

export class UniqueWhereExpander {
	constructor(private readonly schema: Model.Schema) {}

	expand(entity: Model.Entity, where: ExtendedUniqueWhere, path: string[] = []): Input.Where {
		const isFilled = (field: string) => where[field] !== undefined && where[field] !== null

		const isUnique = (() => {
			if (isFilled(entity.primary)) {
				return true
			}
			uniqueKeys: for (const fields of getFieldsForUniqueWhere(this.schema, entity)) {
				for (const field of fields) {
					if (!isFilled(field)) {
						continue uniqueKeys
					}
				}
				return true
			}
			return false
		})()

		if (!isUnique) {
			throw new UniqueWhereError(this.formatErrorMessage(entity, where, path))
		}

		const whereExpanded: Writable<Input.Where> = {}
		for (const field in where) {
			if (!isFilled(field)) {
				continue
			}
			const target = getTargetEntity(this.schema, entity, field)
			if (!target) {
				whereExpanded[field] = Array.isArray(where[field]) ? { in: where[field] as any } : { eq: where[field] }
			} else {
				whereExpanded[field] = this.expand(target, where[field] as Input.UniqueWhere, [...path, field])
			}
		}

		return whereExpanded
	}

	private formatErrorMessage(entity: Model.Entity, where: ExtendedUniqueWhere, path: string[]): string {
		const knownUniqueKeys = getFieldsForUniqueWhere(this.schema, entity)
			.map(it => it.join(', '))
			.map(it => `\t - ${it}`)
			.join('\n')
		return `Provided where is not unique for entity ${entity.name}:
Provided value${path.length ? ` in path $.${path.join('.')}` : ''}: ${JSON.stringify(where)}
Known unique key combinations:
${knownUniqueKeys}`
	}
}

export class UniqueWhereError extends UserError {}
