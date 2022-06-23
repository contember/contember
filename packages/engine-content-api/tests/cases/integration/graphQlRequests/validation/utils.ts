import { execute, SqlQuery } from '../../../../src/test.js'
import { GQL } from '../../../../src/tags.js'
import { Input, Result, Schema } from '@contember/schema'
import { InputValidation, SchemaDefinition } from '@contember/schema-definition'
import { emptySchema } from '@contember/schema-utils'

export interface UpdateTest {
	schema: Schema
	entity: string
	executes?: SqlQuery[]
	by: Input.UniqueWhere
	data: Input.UpdateDataInput
	errors: string[] | Result.ValidationError[]
}

const simplifiedValidationGqlPart = `
valid
errors {
    message {
        text
    }
}`
const validationGqlPart = `
valid
errors {
    message {
        text
    }
    path {
        ... on _IndexPathFragment {
            index
            alias
        }
        ... on _FieldPathFragment {
            field
        }
    }
}`

export const testUpdate = async (test: UpdateTest) => {
	const simplifiedErrors = test.errors.length === 0 || typeof test.errors[0] === 'string'
	const schema = test.schema
	return await execute({
		schema: schema.model,
		validation: schema.validation,
		executes: test.executes || [],
		query: GQL`query($data: ${test.entity}UpdateInput!, $by: ${test.entity}UniqueWhere!) {
					result: validateUpdate${test.entity}(data: $data, by: $by) {
							${simplifiedErrors ? simplifiedValidationGqlPart : validationGqlPart}
					}
			}`,
		queryVariables: { data: test.data, by: test.by },
		return: {
			data: {
				result: {
					errors: (test.errors as any).map((it: string | Result.ValidationError) =>
						typeof it === 'string' ? { message: { text: it } } : it,
					),
					valid: test.errors.length === 0,
				},
			},
		},
	})
}

interface CreateTest {
	schema: Schema
	entity: string
	executes?: SqlQuery[]
	data: Input.CreateDataInput
	errors: string[] | Result.ValidationError[]
}

export const testCreate = async (test: CreateTest) => {
	const schema = test.schema
	const simplifiedErrors = test.errors.length === 0 || typeof test.errors[0] === 'string'
	return await execute({
		schema: schema.model,
		validation: schema.validation,
		executes: test.executes || [],
		query: GQL`query($data: ${test.entity}CreateInput!) {
					result: validateCreate${test.entity}(data: $data) {
							${simplifiedErrors ? simplifiedValidationGqlPart : validationGqlPart}
					}
			}`,
		queryVariables: { data: test.data },
		return: {
			data: {
				result: {
					errors: (test.errors as any).map((it: string | Result.ValidationError) =>
						typeof it === 'string' ? { message: { text: it } } : it,
					),
					valid: test.errors.length === 0,
				},
			},
		},
	})
}

export const createSchema = <M extends SchemaDefinition.ModelDefinition<M>>(definitions: M): Schema => {
	const model = SchemaDefinition.createModel(definitions)
	const schema: Schema = {
		...emptySchema,
		validation: InputValidation.parseDefinition(definitions),
		model,
	}
	return schema
}
