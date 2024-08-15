import { Schema } from '@contember/schema'
import crypto from 'node:crypto'


export const calculateSchemaChecksum = (schema: Schema): string => {
	const jsonSchema = JSON.stringify(schema)

	return crypto
		.createHash('md5')
		.update(jsonSchema)
		.digest('hex')
}
