import { Input, Model } from '@contember/schema'
import { getTargetEntity, getUniqueConstraints } from '@contember/schema-utils'
import { UserError } from '../exception'

export class UniqueWhereExpander {
	constructor(private readonly schema: Model.Schema) {}

	expand(entity: Model.Entity, where: Input.UniqueWhere, path: string[] = []): Input.Where {
		const isFilled = (field: string) => where[field] !== undefined && where[field] !== null

		const isUnique = (() => {
			if (isFilled(entity.primary)) {
				return true
			}
			uniqueKeys: for (const unique of getUniqueConstraints(this.schema, entity)) {
				for (const field of unique.fields) {
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

		const whereExpanded: Input.Where = {}
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

	private formatErrorMessage(entity: Model.Entity, where: Input.UniqueWhere, path: string[]): string {
		const knownUniqueKeys = [{ fields: [entity.primary] }, ...getUniqueConstraints(this.schema, entity)]
			.map(it => it.fields.join(', '))
			.map(it => `\t - ${it}`)
			.join('\n')
		return `Provided where is not unique for entity ${entity.name}:
Provided value${path.length ? ` in path $.${path.join('.')}` : ''}: ${JSON.stringify(where)}
Known unique key combinations:
${knownUniqueKeys}`
	}
}

export class UniqueWhereError extends UserError {}
