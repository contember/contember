import { Model } from '@contember/schema'
import { getEnumTypeName } from './utils'

export class EnumTypeSchemaGenerator {
	generate(model: Model.Schema): string {
		let code = ''
		for (const [enumName, values] of Object.entries(model.enums)) {
			code += `export type ${getEnumTypeName(enumName)} = ${values.map(it => '\n\t | ' + JSON.stringify(it)).join('')}\n`
		}

		return code || 'export {}\n'
	}
}
