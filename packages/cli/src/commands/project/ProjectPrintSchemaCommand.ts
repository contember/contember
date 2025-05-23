import { Command, CommandConfiguration, Input } from '@contember/cli-common'
import {
	Authorizator,
	EntityRulesResolver,
	GraphQlSchemaBuilderFactory,
	IntrospectionSchemaDefinitionFactory,
	IntrospectionSchemaFactory,
	PermissionFactory,
} from '@contember/engine-content-api'
import { printSchema } from 'graphql'
import { mergeSchemas } from '@graphql-tools/schema'
import { emptySchema, normalizeSchema } from '@contember/schema-utils'
import { SchemaLoader } from '../../lib/schema/SchemaLoader'
import { SchemaVersionBuilder } from '@contember/migrations-client'
import { validateSchemaAndPrintErrors } from '../../lib/schema/SchemaValidationHelper'

type Args = {
}

type Options = {
	role?: string[]
	normalize?: boolean
	format?: 'graphql' | 'introspection' | 'schema'
	source?: 'migrations' | 'definition'
	['omit-acl']?: boolean
	['omit-validation']?: boolean
	['omit-actions']?: boolean
	['omit-settings']?: boolean
}

export class ProjectPrintSchemaCommand extends Command<Args, Options> {
	constructor(
		private readonly schemaLoader: SchemaLoader,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Prints project schema')
		configuration.option('format').valueRequired().description('graphql|introspection|schema')
		configuration.option('source').valueRequired().description('migrations|definition')
		configuration.option('role').valueArray()
		configuration.option('normalize').valueNone()
		configuration.option('omit-acl').valueNone()
		configuration.option('omit-validation').valueNone()
		configuration.option('omit-actions').valueNone()
		configuration.option('omit-settings').valueNone()
	}

	protected async execute(input: Input<Args, Options>): Promise<number> {
		const format = input.getOption('format') || 'graphql'


		const schema = input.getOption('source') === 'migrations'
			? await this.schemaVersionBuilder.buildSchema()
			: await this.schemaLoader.loadSchema()

		const filteredSchema = {
			model: schema.model,
			acl: input.getOption('omit-acl') ? emptySchema.acl : schema.acl,
			validation: input.getOption('omit-validation') ? emptySchema.validation : schema.validation,
			actions: input.getOption('omit-actions') ? emptySchema.actions : schema.actions,
			settings: input.getOption('omit-settings') ? emptySchema.settings : schema.settings,
		}

		if (!validateSchemaAndPrintErrors(filteredSchema, 'Defined schema is invalid:')) {
			return 1
		}

		const permissionFactory = new PermissionFactory()
		const inputRoles = input.getOption('role')
		const schemaNormalized = input.getOption('normalize') ? normalizeSchema(filteredSchema) : filteredSchema
		const permissions = permissionFactory.create(schemaNormalized, inputRoles || ['admin'])
		const schemaBuilderFactory = new GraphQlSchemaBuilderFactory()
		const authorizator = new Authorizator(
			permissions,
			schemaNormalized.acl.customPrimary ?? false,
			Object.values(schemaNormalized.acl.roles).some(it => it.content?.refreshMaterializedView),
		)
		const introspection = new IntrospectionSchemaFactory(
			schemaNormalized.model,
			new EntityRulesResolver(schemaNormalized.validation, schemaNormalized.model),
			authorizator,
		)

		const printByLine = (out: string) => {
			out.split('\n').forEach(line => {
				process.stdout.write(line + '\n')
			})
		}
		if (format === 'schema') {
			if (inputRoles) {
				throw `--roles option is not supported for "schema" format`
			}
			const jsonString = JSON.stringify(schemaNormalized, null, '\t')
			printByLine(jsonString)
		} else if (format === 'introspection') {
			printByLine(JSON.stringify(introspection.create(), null, '\t'))
		} else if (format === 'graphql') {
			const contentSchema = schemaBuilderFactory.create(schemaNormalized.model, authorizator).build()
			const introspectionSchemaFactory = new IntrospectionSchemaDefinitionFactory(introspection)
			const introspectionSchema = introspectionSchemaFactory.create()
			const gqlSchema = mergeSchemas({
				schemas: [contentSchema, introspectionSchema],
			})
			gqlSchema.description = '' // this enforces schema definition print
			const printedSchema = printSchema(gqlSchema).replace('""""""\n', '') // remove empty comment
			printByLine(printedSchema)
		} else {
			throw `Unknown format ${format}`
		}

		return 0
	}
}
