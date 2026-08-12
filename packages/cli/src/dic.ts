import { Builder } from '@contember/dic'
import {
	JsLoader,
	JsonLoader,
	MigrationCreator,
	MigrationDescriber,
	MigrationExecutor,
	MigrationFilesManager,
	MigrationParser,
	MigrationsResolver,
	MigrationsStatusResolver,
	ModificationHandlerFactory,
	SchemaDiffer,
	SchemaMigrator,
	SchemaStateManager,
	SchemaVersionBuilder,
	SnapshotManager,
	VERSION_LATEST,
} from '@contember/migrations-client'
import { JsCodeRunner } from './lib/js/JsCodeRunner.js'
import { EsBuildBuilder } from './lib/js/EsBuildBuilder.js'
import { EvalExecutor } from './lib/js/EvalExecutor.js'
import { AdminDeployer } from './lib/admin/AdminDeployer.js'
import { RemoteProjectResolver } from './lib/project/RemoteProjectResolver.js'
import { CliEnv } from './lib/env.js'
import { AdminClient } from './lib/admin/AdminClient.js'
import { FileSystem } from './lib/fs/FileSystem.js'
import { WorkspaceResolver } from './lib/workspace/WorkspaceResolver.js'
import { YamlHandler } from './lib/fs/YamlHandler.js'
import {
	CommandsCommand,
	DeployCommand,
	MigrationAmendCommand,
	MigrationBlankCommand,
	MigrationDescribeCommand,
	MigrationDiffCommand,
	MigrationExecuteCommand,
	MigrationInitStateCommand,
	MigrationRebaseCommand,
	MigrationSnapshotCommand,
	MigrationStatusCommand,
	MigrationVerifySnapshotCommand,
	ProjectGenerateDocumentationCommand,
	ProjectPrintSchemaCommand,
	ProjectValidateCommand,
	VersionCommand,
	WorkspaceUpdateApiCommand,
} from './commands/index.js'
import { MigrationExecutionFacade } from './lib/migrations/MigrationExecutionFacade.js'
import { MigrationPrinter } from './lib/migrations/MigrationPrinter.js'
import { MigrationSnapshotFacade } from './lib/migrations/MigrationSnapshotFacade.js'
import { MigrationsStatusFacade } from './lib/migrations/MigrationsStatusFacade.js'
import { ImportSchemaLoader, SchemaLoader, TranspilingSchemaLoader } from './lib/schema/SchemaLoader.js'
import { MigrationsValidator } from './lib/migrations/MigrationsValidator.js'
import { MigrationRebaseFacade } from './lib/migrations/MigrationRebaseFacade.js'
import { DataTransferClient } from './lib/transfer/DataTransferClient.js'
import { ExportCommand, ImportCommand, TransferCommand } from './commands/transfer/index.js'
import {
	Application,
	Bun,
	CommandFactory,
	CommandFactoryList,
	CommandManager,
	CommandRunner,
	Npm,
	Output,
	PackageWorkspaceResolver,
	Pnpm,
	Yarn,
	YarnClassic,
} from '@contember/cli-common'
import { VersionChecker } from './lib/VersionChecker.js'
import { DockerComposeManager } from './lib/fs/DockerComposeManager.js'
import { RemoteProjectProvider } from './lib/project/RemoteProjectProvider.js'
import { SystemClientProvider } from './lib/SystemClientProvider.js'
import { TenantClientProvider } from './lib/TenantClientProvider.js'
import { Workspace } from './lib/workspace/Workspace.js'
import { ActionsListVariablesCommand } from './commands/actions/ActionsListVariablesCommand.js'
import { ActionsSetVariablesCommand } from './commands/actions/ActionsSetVariablesCommand.js'
import { ActionsListFailedEventsCommand } from './commands/actions/ActionsListFailedEventsCommand.js'
import { ActionsRetryEventCommand } from './commands/actions/ActionsRetryEventCommand.js'
import { ActionsGetEventCommand } from './commands/actions/ActionsGetEventCommand.js'
import { ActionsStopEventCommand } from './commands/actions/ActionsStopEventCommand.js'
import {
	TenantApiKeyCreateCommand,
	TenantApiKeyDisableCommand,
	TenantApiKeyListCommand,
	TenantApplyCommand,
	TenantAuthLogCommand,
	TenantConfigShowCommand,
	TenantIdentityRoleAddCommand,
	TenantIdentityRoleRemoveCommand,
	TenantIdpListCommand,
	TenantMailTemplateAddCommand,
	TenantMailTemplateListCommand,
	TenantMailTemplateRemoveCommand,
	TenantMemberAddCommand,
	TenantMemberInviteCommand,
	TenantMemberInviteUnmanagedCommand,
	TenantMemberListCommand,
	TenantMemberRemoveCommand,
	TenantMemberUpdateCommand,
	TenantPersonCreateCommand,
	TenantPersonDisableCommand,
	TenantPersonListCommand,
	TenantPersonResetMfaCommand,
	TenantPersonResetPasswordRequestCommand,
	TenantPersonSetPasswordCommand,
	TenantPersonShowCommand,
	TenantPersonSignOutCommand,
	TenantPersonUpdateCommand,
	TenantPolicyCreateCommand,
	TenantPolicyDeleteCommand,
	TenantPolicyListCommand,
	TenantPolicyUpdateCommand,
	TenantProjectCreateCommand,
	TenantProjectListCommand,
	TenantProjectSecretSetCommand,
	TenantProjectShowCommand,
	TenantProjectUpdateCommand,
	TenantSessionCreateCommand,
	TenantWhoAmICommand,
} from './commands/tenant/index.js'
import { ImportTenantConfigLoader, TranspilingTenantConfigLoader } from './lib/tenant/TenantConfigLoader.js'
import { TenantConfigApplier } from './lib/tenant/TenantConfigApplier.js'
import { TenantConnectionProvider } from './lib/tenant/TenantConnectionProvider.js'
import { TenantConnectionResolver } from './lib/tenant/TenantConnectionResolver.js'

const jsSample = `
export const query = \`\`
export const variables = {}

// or multiple queries
// export const queries = []

// or a factory
// export default async () => ({ queries: [] })
`

export const createContainer = ({ env, version, runtime, workspace, output }: {
	workspace: Workspace
	env: CliEnv
	version: string
	runtime: 'node' | 'bun'
	output: Output
}) => {
	return new Builder({})
		.addService('env', () => env)
		.addService('version', () => version)
		.addService('runtime', () => runtime)
		.addService('workspace', () => workspace)
		.addService('output', () => output)
		.addService('fs', () => new FileSystem())
		.addService('yamlHandler', ({ fs }) => new YamlHandler(fs))
		.addService('jsExecutor', () => new EvalExecutor())
		.addService('jsBuilder', () => new EsBuildBuilder())
		.addService('jsCodeRunner', ({ jsExecutor, jsBuilder }) => new JsCodeRunner(jsBuilder, jsExecutor))
		.addService('workspaceResolver', ({ yamlHandler }) => new WorkspaceResolver(yamlHandler))
		.addService('remoteProjectResolver', ({ env }) => new RemoteProjectResolver(env))
		.addService('tenantConnectionResolver', ({ env }) => new TenantConnectionResolver(env))
		.addService('tenantConnectionProvider', ({ tenantConnectionResolver }) => new TenantConnectionProvider(tenantConnectionResolver))
		.addService('remoteProjectProvider', ({ remoteProjectResolver }) => {
			const provider = new RemoteProjectProvider()
			const remoteProject = remoteProjectResolver.resolve()
			if (remoteProject) {
				provider.setRemoteProject(remoteProject)
			}
			return provider
		})
		.addService('systemClientProvider', ({ remoteProjectProvider }) => new SystemClientProvider(remoteProjectProvider))
		.addService('tenantClientProvider', ({ tenantConnectionProvider }) => new TenantClientProvider(tenantConnectionProvider))
		.addService('migrationTenantClientProvider', ({ remoteProjectProvider }) => new TenantClientProvider(remoteProjectProvider))
		.addService('adminClient', ({ remoteProjectProvider }) => new AdminClient(remoteProjectProvider))
		.addService('migrationFilesManager', ({ jsCodeRunner, workspace }) => {
			const runJs = runtime === 'bun' ? (file: string) => import(file) : jsCodeRunner.run
			return new MigrationFilesManager(workspace.migrationsDir, {
				json: new JsonLoader(new MigrationParser()),
				ts: new JsLoader(new MigrationParser(), runJs),
				js: new JsLoader(new MigrationParser(), runJs),
			})
		})
		.addService('packageWorkspaceResolver', ({ workspace, fs, output }) => {
			const commandRunner = new CommandRunner(output)
			return new PackageWorkspaceResolver(workspace.baseDir, fs, [
				new Yarn(fs, commandRunner),
				new YarnClassic(fs, commandRunner),
				new Pnpm(fs, commandRunner),
				new Npm(fs, commandRunner),
				new Bun(fs, commandRunner),
			])
		})
		.addService(
			'dockerComposeManager',
			({ workspace, env, fs, yamlHandler }) => new DockerComposeManager(workspace.baseDir, env.dockerComposeFile, fs, yamlHandler),
		)
		.addService('modificationHandlerFactory', () => new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap))
		.addService('schemaMigrator', ({ modificationHandlerFactory }) => new SchemaMigrator(modificationHandlerFactory))
		.addService('migrationsResolver', ({ migrationFilesManager }) => new MigrationsResolver(migrationFilesManager))
		.addService('schemaStateManager', ({ workspace }) => new SchemaStateManager(workspace.migrationsDir + '/state'))
		.addService('snapshotManager', ({ workspace }) => new SnapshotManager(workspace.migrationsDir + '/snapshot.json'))
		.addService(
			'schemaVersionBuilder',
			({ migrationsResolver, schemaMigrator, schemaStateManager }) => new SchemaVersionBuilder(migrationsResolver, schemaMigrator, schemaStateManager),
		)
		.addService('schemaDiffer', ({ schemaMigrator }) =>
			new SchemaDiffer(schemaMigrator, {
				maxPatchSize: env.migrationsOptions?.maxPatchSize,
			}))
		.addService('migrationCreator', ({ migrationFilesManager, schemaDiffer }) =>
			new MigrationCreator(migrationFilesManager, schemaDiffer, {
				json: JSON.stringify({ formatVersion: VERSION_LATEST, modifications: [] }, undefined, '\t') + '\n',
				ts: jsSample,
				js: jsSample,
			}))
		.addService('migrationDescriber', ({ modificationHandlerFactory }) => new MigrationDescriber(modificationHandlerFactory))
		.addService('migrationPrinter', ({ migrationDescriber, output }) => new MigrationPrinter(migrationDescriber, output))
		.addService('migrationsExecutor', () => new MigrationExecutor())
		.addService('migrationsStatusResolver', () => new MigrationsStatusResolver())
		.addService(
			'migrationSnapshotFacade',
			({ migrationsResolver, schemaVersionBuilder, schemaDiffer, schemaMigrator, schemaStateManager, snapshotManager, output }) =>
				new MigrationSnapshotFacade(
					migrationsResolver,
					schemaVersionBuilder,
					schemaDiffer,
					schemaMigrator,
					schemaStateManager,
					snapshotManager,
					output,
				),
		)
		.addService(
			'migrationsStatusFacade',
			({ systemClientProvider, migrationsResolver, migrationsStatusResolver, migrationPrinter, output }) =>
				new MigrationsStatusFacade(systemClientProvider, migrationsResolver, migrationsStatusResolver, migrationPrinter, output),
		)
		.addService(
			'migrationExecutionFacade',
			({
				systemClientProvider,
				migrationTenantClientProvider,
				remoteProjectProvider,
				schemaVersionBuilder,
				migrationPrinter,
				migrationsExecutor,
				migrationsStatusFacade,
				schemaStateManager,
				migrationSnapshotFacade,
				output,
			}) =>
				new MigrationExecutionFacade(
					systemClientProvider,
					migrationTenantClientProvider,
					remoteProjectProvider,
					schemaVersionBuilder,
					migrationPrinter,
					migrationsExecutor,
					migrationsStatusFacade,
					schemaStateManager,
					migrationSnapshotFacade,
					output,
				),
		)
		.addService(
			'migrationsValidator',
			({ migrationDescriber, schemaMigrator, output }) => new MigrationsValidator(migrationDescriber, schemaMigrator, output),
		)
		.addService(
			'migrationRebaseFacade',
			({ schemaVersionBuilder, migrationsValidator, systemClientProvider, migrationFilesManager, schemaStateManager }) =>
				new MigrationRebaseFacade(schemaVersionBuilder, migrationsValidator, systemClientProvider, migrationFilesManager, schemaStateManager),
		)
		.addService(
			'schemaLoader',
			({ workspace, jsCodeRunner, runtime }) =>
				runtime === 'bun' ? new ImportSchemaLoader(workspace) : new TranspilingSchemaLoader(workspace, jsCodeRunner),
		)
		.addService(
			'adminDeployer',
			({ remoteProjectProvider, adminClient, fs, output }) => new AdminDeployer(remoteProjectProvider, adminClient, fs, output),
		)
		.addService('dataTransferClient', () => new DataTransferClient())
		.addService(
			'deployCommand',
			({ adminDeployer, migrationExecutionFacade, fs, remoteProjectProvider, remoteProjectResolver, workspace }) =>
				new DeployCommand(adminDeployer, migrationExecutionFacade, fs, remoteProjectProvider, remoteProjectResolver, workspace),
		)
		.addService(
			'migrationAmendCommand',
			({
				migrationsResolver,
				systemClientProvider,
				migrationsStatusFacade,
				schemaLoader,
				schemaVersionBuilder,
				migrationCreator,
				migrationsValidator,
				migrationPrinter,
				schemaMigrator,
				schemaStateManager,
			}) =>
				new MigrationAmendCommand(
					migrationsResolver,
					systemClientProvider,
					migrationsStatusFacade,
					schemaLoader,
					schemaVersionBuilder,
					migrationCreator,
					migrationsValidator,
					migrationPrinter,
					schemaMigrator,
					schemaStateManager,
				),
		)
		.addService('migrationBlankCommand', ({ migrationCreator }) => new MigrationBlankCommand(migrationCreator))
		.addService(
			'migrationDescribeCommand',
			({ migrationPrinter, schemaVersionBuilder, migrationsResolver }) =>
				new MigrationDescribeCommand(migrationPrinter, schemaVersionBuilder, migrationsResolver),
		)
		.addService(
			'migrationDiffCommand',
			({ schemaLoader, schemaVersionBuilder, migrationCreator, migrationPrinter, migrationExecutionFacade, schemaStateManager, migrationsResolver }) =>
				new MigrationDiffCommand(
					schemaLoader,
					schemaVersionBuilder,
					migrationCreator,
					migrationPrinter,
					migrationExecutionFacade,
					schemaStateManager,
					migrationsResolver,
				),
		)
		.addService('migrationExecuteCommand', ({ migrationExecutionFacade }) => new MigrationExecuteCommand(migrationExecutionFacade))
		.addService(
			'migrationInitStateCommand',
			({ schemaLoader, schemaStateManager }) => new MigrationInitStateCommand(schemaLoader, schemaStateManager),
		)
		.addService(
			'migrationRebaseCommand',
			({ migrationsResolver, migrationRebaseFacade }) => new MigrationRebaseCommand(migrationsResolver, migrationRebaseFacade),
		)
		.addService('migrationSnapshotCommand', ({ migrationSnapshotFacade }) => new MigrationSnapshotCommand(migrationSnapshotFacade))
		.addService(
			'migrationVerifySnapshotCommand',
			({ migrationSnapshotFacade }) => new MigrationVerifySnapshotCommand(migrationSnapshotFacade),
		)
		.addService(
			'migrationStatusCommand',
			({ migrationsStatusFacade, migrationFilesManager, systemClientProvider, migrationPrinter }) =>
				new MigrationStatusCommand(migrationsStatusFacade, migrationFilesManager, systemClientProvider, migrationPrinter),
		)
		.addService('versionCommand', ({ version }) => new VersionCommand(version))
		.addService(
			'projectGenerateDocumentationCommand',
			({ schemaLoader, schemaVersionBuilder }) => new ProjectGenerateDocumentationCommand(schemaLoader, schemaVersionBuilder),
		)
		.addService(
			'projectPrintSchemaCommand',
			({ schemaLoader, schemaVersionBuilder }) => new ProjectPrintSchemaCommand(schemaLoader, schemaVersionBuilder),
		)
		.addService(
			'projectValidateCommand',
			({ schemaLoader, migrationsValidator, migrationsResolver, schemaDiffer, schemaVersionBuilder }) =>
				new ProjectValidateCommand(schemaLoader, migrationsValidator, migrationsResolver, schemaDiffer, schemaVersionBuilder),
		)
		.addService('exportCommand', ({ dataTransferClient, remoteProjectResolver }) => new ExportCommand(remoteProjectResolver, dataTransferClient))
		.addService('importCommand', ({ dataTransferClient, remoteProjectResolver }) => new ImportCommand(remoteProjectResolver, dataTransferClient))
		.addService('transferCommand', ({ dataTransferClient, remoteProjectResolver }) => new TransferCommand(remoteProjectResolver, dataTransferClient))
		.addService(
			'workspaceUpdateCommand',
			({ packageWorkspaceResolver, dockerComposeManager }) => new WorkspaceUpdateApiCommand(packageWorkspaceResolver, dockerComposeManager),
		)
		.addService('actionsListVariables', ({ remoteProjectResolver }) => new ActionsListVariablesCommand(remoteProjectResolver))
		.addService('actionsSetVariables', ({ remoteProjectResolver }) => new ActionsSetVariablesCommand(remoteProjectResolver))
		.addService('actionsListFailedEvents', ({ remoteProjectResolver }) => new ActionsListFailedEventsCommand(remoteProjectResolver))
		.addService('actionsRetryEvent', ({ remoteProjectResolver }) => new ActionsRetryEventCommand(remoteProjectResolver))
		.addService('actionsGetEvent', ({ remoteProjectResolver }) => new ActionsGetEventCommand(remoteProjectResolver))
		.addService('actionsStopEvent', ({ remoteProjectResolver }) => new ActionsStopEventCommand(remoteProjectResolver))
		.addService(
			'tenantConfigLoader',
			({ jsCodeRunner }) => runtime === 'bun' ? new ImportTenantConfigLoader() : new TranspilingTenantConfigLoader(jsCodeRunner),
		)
		.addService('tenantConfigApplier', ({ output }) => new TenantConfigApplier(output))
		.addService(
			'tenantApplyCommand',
			({ remoteProjectResolver, tenantConfigLoader, tenantConfigApplier }) =>
				new TenantApplyCommand(remoteProjectResolver, tenantConfigLoader, tenantConfigApplier),
		)
		.addService('tenantProjectListCommand', ({ tenantClientProvider }) => new TenantProjectListCommand(tenantClientProvider))
		.addService('tenantProjectShowCommand', ({ tenantClientProvider }) => new TenantProjectShowCommand(tenantClientProvider))
		.addService('tenantProjectCreateCommand', ({ tenantClientProvider }) => new TenantProjectCreateCommand(tenantClientProvider))
		.addService('tenantProjectUpdateCommand', ({ tenantClientProvider }) => new TenantProjectUpdateCommand(tenantClientProvider))
		.addService('tenantProjectSecretSetCommand', ({ tenantClientProvider }) => new TenantProjectSecretSetCommand(tenantClientProvider))
		.addService('tenantConfigShowCommand', ({ tenantClientProvider }) => new TenantConfigShowCommand(tenantClientProvider))
		.addService('tenantIdpListCommand', ({ tenantClientProvider }) => new TenantIdpListCommand(tenantClientProvider))
		.addService('tenantWhoAmICommand', ({ tenantClientProvider }) => new TenantWhoAmICommand(tenantClientProvider))
		.addService('tenantPersonListCommand', ({ tenantClientProvider }) => new TenantPersonListCommand(tenantClientProvider))
		.addService('tenantPersonShowCommand', ({ tenantClientProvider }) => new TenantPersonShowCommand(tenantClientProvider))
		.addService('tenantPersonCreateCommand', ({ tenantClientProvider }) => new TenantPersonCreateCommand(tenantClientProvider))
		.addService('tenantPersonUpdateCommand', ({ tenantClientProvider }) => new TenantPersonUpdateCommand(tenantClientProvider))
		.addService('tenantPersonSetPasswordCommand', ({ tenantClientProvider }) => new TenantPersonSetPasswordCommand(tenantClientProvider))
		.addService('tenantPersonDisableCommand', ({ tenantClientProvider }) => new TenantPersonDisableCommand(tenantClientProvider))
		.addService('tenantPersonSignOutCommand', ({ tenantClientProvider }) => new TenantPersonSignOutCommand(tenantClientProvider))
		.addService('tenantPersonResetMfaCommand', ({ tenantClientProvider }) => new TenantPersonResetMfaCommand(tenantClientProvider))
		.addService(
			'tenantPersonResetPasswordRequestCommand',
			({ tenantClientProvider }) => new TenantPersonResetPasswordRequestCommand(tenantClientProvider),
		)
		.addService('tenantSessionCreateCommand', ({ tenantClientProvider }) => new TenantSessionCreateCommand(tenantClientProvider))
		.addService('tenantIdentityRoleAddCommand', ({ tenantClientProvider }) => new TenantIdentityRoleAddCommand(tenantClientProvider))
		.addService('tenantIdentityRoleRemoveCommand', ({ tenantClientProvider }) => new TenantIdentityRoleRemoveCommand(tenantClientProvider))
		.addService('tenantMemberListCommand', ({ tenantClientProvider }) => new TenantMemberListCommand(tenantClientProvider))
		.addService('tenantMemberAddCommand', ({ tenantClientProvider }) => new TenantMemberAddCommand(tenantClientProvider))
		.addService('tenantMemberUpdateCommand', ({ tenantClientProvider }) => new TenantMemberUpdateCommand(tenantClientProvider))
		.addService('tenantMemberRemoveCommand', ({ tenantClientProvider }) => new TenantMemberRemoveCommand(tenantClientProvider))
		.addService('tenantMemberInviteCommand', ({ tenantClientProvider }) => new TenantMemberInviteCommand(tenantClientProvider))
		.addService(
			'tenantMemberInviteUnmanagedCommand',
			({ tenantClientProvider }) => new TenantMemberInviteUnmanagedCommand(tenantClientProvider),
		)
		.addService('tenantApiKeyListCommand', ({ tenantClientProvider }) => new TenantApiKeyListCommand(tenantClientProvider))
		.addService('tenantApiKeyCreateCommand', ({ tenantClientProvider }) => new TenantApiKeyCreateCommand(tenantClientProvider))
		.addService('tenantApiKeyDisableCommand', ({ tenantClientProvider }) => new TenantApiKeyDisableCommand(tenantClientProvider))
		.addService('tenantPolicyListCommand', ({ tenantClientProvider }) => new TenantPolicyListCommand(tenantClientProvider))
		.addService('tenantPolicyCreateCommand', ({ tenantClientProvider }) => new TenantPolicyCreateCommand(tenantClientProvider))
		.addService('tenantPolicyUpdateCommand', ({ tenantClientProvider }) => new TenantPolicyUpdateCommand(tenantClientProvider))
		.addService('tenantPolicyDeleteCommand', ({ tenantClientProvider }) => new TenantPolicyDeleteCommand(tenantClientProvider))
		.addService('tenantMailTemplateListCommand', ({ tenantClientProvider }) => new TenantMailTemplateListCommand(tenantClientProvider))
		.addService('tenantMailTemplateAddCommand', ({ tenantClientProvider }) => new TenantMailTemplateAddCommand(tenantClientProvider))
		.addService('tenantMailTemplateRemoveCommand', ({ tenantClientProvider }) => new TenantMailTemplateRemoveCommand(tenantClientProvider))
		.addService('tenantAuthLogCommand', ({ tenantClientProvider }) => new TenantAuthLogCommand(tenantClientProvider))
		.addService('commandsCommand', () => new CommandsCommand())
		.addService('commandList', dic => {
			const commands: CommandFactoryList = {}
			// Canonical multi-token names always retain their silent colon compatibility alias.
			const register = (name: string, factory: CommandFactory) => {
				commands[name] = factory
				const colonAlias = name.includes(' ') ? name.split(' ').join(':') : undefined
				if (colonAlias !== undefined) {
					commands[colonAlias] = factory
				}
			}
			register('deploy', () => dic.deployCommand)
			register('version', () => dic.versionCommand)
			register('commands', () => dic.commandsCommand)
			register('data export', () => dic.exportCommand)
			register('data import', () => dic.importCommand)
			register('data transfer', () => dic.transferCommand)
			register('migrations diff', () => dic.migrationDiffCommand)
			register('migrations amend', () => dic.migrationAmendCommand)
			register('migrations blank', () => dic.migrationBlankCommand)
			register('migrations init-state', () => dic.migrationInitStateCommand)
			register('migrations describe', () => dic.migrationDescribeCommand)
			register('migrations execute', () => dic.migrationExecuteCommand)
			register('migrations rebase', () => dic.migrationRebaseCommand)
			register('migrations snapshot', () => dic.migrationSnapshotCommand)
			register('migrations verify-snapshot', () => dic.migrationVerifySnapshotCommand)
			register('migrations status', () => dic.migrationStatusCommand)
			register('workspace update api', () => dic.workspaceUpdateCommand)
			register('project validate', () => dic.projectValidateCommand)
			register('project print-schema', () => dic.projectPrintSchemaCommand)
			register('project generate-doc', () => dic.projectGenerateDocumentationCommand)
			register('actions list-variables', () => dic.actionsListVariables)
			register('actions set-variables', () => dic.actionsSetVariables)
			register('actions failed-events', () => dic.actionsListFailedEvents)
			register('actions retry-event', () => dic.actionsRetryEvent)
			register('actions get-event', () => dic.actionsGetEvent)
			register('actions stop-event', () => dic.actionsStopEvent)
			register('tenant apply', () => dic.tenantApplyCommand)
			register('tenant whoami', () => dic.tenantWhoAmICommand)
			register('tenant auth-log', () => dic.tenantAuthLogCommand)
			register('tenant config show', () => dic.tenantConfigShowCommand)
			register('tenant idp list', () => dic.tenantIdpListCommand)
			register('tenant project list', () => dic.tenantProjectListCommand)
			register('tenant project show', () => dic.tenantProjectShowCommand)
			register('tenant project create', () => dic.tenantProjectCreateCommand)
			register('tenant project update', () => dic.tenantProjectUpdateCommand)
			register('tenant project secret set', () => dic.tenantProjectSecretSetCommand)
			register('tenant person list', () => dic.tenantPersonListCommand)
			register('tenant person show', () => dic.tenantPersonShowCommand)
			register('tenant person create', () => dic.tenantPersonCreateCommand)
			register('tenant person update', () => dic.tenantPersonUpdateCommand)
			register('tenant person set-password', () => dic.tenantPersonSetPasswordCommand)
			register('tenant person disable', () => dic.tenantPersonDisableCommand)
			register('tenant person sign-out', () => dic.tenantPersonSignOutCommand)
			register('tenant person reset-mfa', () => dic.tenantPersonResetMfaCommand)
			register('tenant person reset-password-request', () => dic.tenantPersonResetPasswordRequestCommand)
			register('tenant session create', () => dic.tenantSessionCreateCommand)
			register('tenant identity role add', () => dic.tenantIdentityRoleAddCommand)
			register('tenant identity role remove', () => dic.tenantIdentityRoleRemoveCommand)
			register('tenant member list', () => dic.tenantMemberListCommand)
			register('tenant member add', () => dic.tenantMemberAddCommand)
			register('tenant member update', () => dic.tenantMemberUpdateCommand)
			register('tenant member remove', () => dic.tenantMemberRemoveCommand)
			register('tenant member invite', () => dic.tenantMemberInviteCommand)
			register('tenant member invite-unmanaged', () => dic.tenantMemberInviteUnmanagedCommand)
			register('tenant api-key list', () => dic.tenantApiKeyListCommand)
			register('tenant api-key create', () => dic.tenantApiKeyCreateCommand)
			register('tenant api-key disable', () => dic.tenantApiKeyDisableCommand)
			register('tenant policy list', () => dic.tenantPolicyListCommand)
			register('tenant policy create', () => dic.tenantPolicyCreateCommand)
			register('tenant policy update', () => dic.tenantPolicyUpdateCommand)
			register('tenant policy delete', () => dic.tenantPolicyDeleteCommand)
			register('tenant mail-template list', () => dic.tenantMailTemplateListCommand)
			register('tenant mail-template add', () => dic.tenantMailTemplateAddCommand)
			register('tenant mail-template remove', () => dic.tenantMailTemplateRemoveCommand)
			return commands
		})
		.addService('commandManager', ({ commandList, commandsCommand }) => {
			const commandManager = new CommandManager(commandList)
			commandsCommand.setCommandManager(commandManager)
			return commandManager
		})
		.addService(
			'versionChecker',
			({ version, workspace, packageWorkspaceResolver, dockerComposeManager }) =>
				new VersionChecker(version, workspace.baseDir, packageWorkspaceResolver, dockerComposeManager),
		)
		.addService('application', ({ commandManager, versionChecker, output }) => {
			const app = new Application(
				commandManager,
				`Contember CLI version ${version}`,
				output,
				{
					beforeRun: async ({ name }) => {
						// the tenant commands only talk to a remote API — they must run outside a Contember workspace too
						const skipped = ['deploy', 'version', 'commands', 'data export', 'data import', 'data transfer']
						if (!process.env.CONTEMBER_SKIP_VERSION_CHECK && !skipped.includes(name) && !name.startsWith('tenant ')) {
							await versionChecker.checkVersions()
						}
					},
				},
			)
			return app
		})
		.build()
}
