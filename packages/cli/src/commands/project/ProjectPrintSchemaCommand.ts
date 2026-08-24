import { CliError, Command, CommandConfiguration, ExitCode, Input, Output } from '@contember/cli-common'
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
import { SchemaLoader } from '../../lib/schema/SchemaLoader.js'
import { SchemaVersionBuilder } from '@contember/migrations-client'
import { validateSchemaAndPrintErrors } from '../../lib/schema/SchemaValidationHelper.js'

type Args = {}

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

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
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

		if (!validateSchemaAndPrintErrors(filteredSchema, 'Defined schema is invalid:', undefined, output)) {
			throw new CliError('Defined schema is invalid', { code: 'SCHEMA_INVALID', exitCode: ExitCode.InputError })
		}

		const permissionFactory = new PermissionFactory()
		const inputRoles = input.getOption('role')
		const schemaNormalized = input.getOption('normalize') ? normalizeSchema(filteredSchema) : filteredSchema
		// Introspection renders types, so it needs the nested set - the same one the engine builds them from.
		const { all: permissions } = permissionFactory.createContextual(schemaNormalized, inputRoles || ['admin'])
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

		if (format === 'schema') {
			if (inputRoles) {
				throw new CliError('The --role option is not supported for the "schema" format', { code: 'UNSUPPORTED_OPTION', exitCode: ExitCode.InputError })
			}
			// human mode keeps the tab-indented rendering; --json is a single JSON.stringify of the same value, not a re-encoding of this string
			output.data(schemaNormalized, {
				human: value => JSON.stringify(value, null, '\t'),
				quiet: value => JSON.stringify(value),
			})
		} else if (format === 'introspection') {
			output.data(introspection.create(), {
				human: value => JSON.stringify(value, null, '\t'),
				quiet: value => JSON.stringify(value),
			})
		} else if (format === 'graphql') {
			const contentSchema = schemaBuilderFactory.create(schemaNormalized.model, authorizator).build()
			const introspectionSchemaFactory = new IntrospectionSchemaDefinitionFactory(introspection)
			const introspectionSchema = introspectionSchemaFactory.create()
			const gqlSchema = mergeSchemas({
				schemas: [contentSchema, introspectionSchema],
			})
			gqlSchema.description = '' // this enforces schema definition print
			const printedSchema = printSchema(gqlSchema).replace('""""""\n', '') // remove empty comment
			output.data(printedSchema, {
				human: value => value,
				quiet: value => value.split('\n'),
			})
		} else {
			throw new CliError(`Unknown schema format "${format}"`, { code: 'UNKNOWN_FORMAT', exitCode: ExitCode.InputError })
		}
	}
}
