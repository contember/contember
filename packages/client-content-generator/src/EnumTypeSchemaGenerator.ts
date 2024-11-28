import { Model } from '@contember/schema'
import { getEnumTypeName } from './utils'

export class EnumTypeSchemaGenerator {
	generate(model: Model.Schema): string {
		let code = ''
		for (const [enumName, values] of Object.entries(model.enums)) {
			code += `export type ${getEnumTypeName(enumName)} = ${values.map(it => '\n\t | ' + JSON.stringify(it)).join('')}\n`
		}
		code += `export type ContemberClientEnums = {\n`
		for (const enumName of Object.keys(model.enums)) {
			code += `\t${enumName}: ${getEnumTypeName(enumName)}\n`
		}
		code += '}\n\n'
		return code
	}
}
