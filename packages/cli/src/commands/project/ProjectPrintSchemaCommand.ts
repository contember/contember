import { Command, CommandConfiguration, Input } from '@contember/cli-common'
import { validateSchemaAndPrintErrors } from '../../utils/schema'
import { Workspace, validateProjectName } from '@contember/cli-common'
import {
	EntityRulesResolver,
	GraphQlSchemaBuilderFactory,
	IntrospectionSchemaDefinitionFactory,
	IntrospectionSchemaFactory,
	PermissionFactory,
	Authorizator,
} from '@contember/engine-content-api'
import { DocumentNode, GraphQLSchema, printSchema } from 'graphql'
import { mergeSchemas } from '@graphql-tools/schema'
import { loadSchema } from '../../utils/project/loadSchema'
import { normalizeSchema } from '@contember/schema-utils'
import { MigrationsContainerFactory } from '../../utils/migrations/MigrationsContainer'

type Args = {
	project?: string
}

type Options = {
	role?: string[]
	normalize?: boolean
	format?: 'graphql' | 'introspection' | 'schema'
	source?: 'migrations' | 'definition'
}

export class ProjectPrintSchemaCommand extends Command<Args, Options> {
	constructor(
		private readonly workspace: Workspace,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Prints project schema')
		if (!this.workspace.isSingleProjectMode()) {
			configuration.argument('project')
		}
		configuration.option('format').valueRequired().description('graphql|introspection|schema')
		configuration.option('source').valueRequired().description('migrations|definition')
		configuration.option('role').valueArray()
		configuration.option('normalize').valueNone()
	}

	protected async execute(input: Input<Args, Options>): Promise<number> {
		const projectName = input.getArgument('project')
		const workspace = this.workspace
		const format = input.getOption('format') || 'graphql'

		const project = await workspace.projects.getProject(projectName, { fuzzy: true })
		const migrationsDir = await project.migrationsDir
		const container = new MigrationsContainerFactory(migrationsDir).create()
		const schema = input.getOption('source') === 'migrations'
			? await container.schemaVersionBuilder.buildSchema()
			: await loadSchema(project)

		if (!validateSchemaAndPrintErrors(schema, 'Defined schema is invalid:')) {
			return 1
		}
		const permissionFactory = new PermissionFactory()
		const inputRoles = input.getOption('role')
		const schemaNormalized = input.getOption('normalize') ? normalizeSchema(schema) : schema
		const permissions = permissionFactory.create(schemaNormalized, inputRoles || ['admin'])
		const schemaBuilderFactory = new GraphQlSchemaBuilderFactory()
		const authorizator = new Authorizator(permissions, schemaNormalized.acl.customPrimary ?? false)
		const introspection = new IntrospectionSchemaFactory(
			schemaNormalized.model,
			new EntityRulesResolver(schemaNormalized.validation, schemaNormalized.model),
			authorizator,
		)
		if (format === 'schema') {
			if (inputRoles) {
				throw `--roles option is not supported for "schema" format`
			}
			console.log(JSON.stringify(schemaNormalized, null, '\t'))
		} else if (format === 'introspection') {
			console.log(JSON.stringify(introspection.create(), null, '\t'))
		} else if (format === 'graphql') {
			const contentSchema = schemaBuilderFactory.create(schemaNormalized.model, authorizator).build()
			const introspectionSchemaFactory = new IntrospectionSchemaDefinitionFactory(introspection)
			const introspectionSchema = introspectionSchemaFactory.create()
			const gqlSchema = mergeSchemas({
				schemas: [contentSchema, introspectionSchema],
			})
			gqlSchema.description = '' // this enforces schema definition print
			const printedSchema = printSchema(gqlSchema).replace('""""""\n', '') // remove empty comment
			console.log(printedSchema)
		} else {
			throw `Unknown format ${format}`
		}

		return 0
	}
}
