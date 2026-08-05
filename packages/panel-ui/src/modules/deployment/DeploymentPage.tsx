import { useTenantQueryLoader } from '@contember/react-client-tenant'
import { Button, Loader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableWrapper } from '@contember/react-ui-lib-base'
import { renderConfigQueryState } from '@contember/react-ui-lib-tenant'
import { RefreshCwIcon, TerminalIcon } from 'lucide-react'
import { PageHeader, PageStack, PanelSection } from '../../shell/screens.js'
import { PanelSlots } from '../../shell/slots.js'
import { type DeploymentStage, type ExecutedMigration, useExecutedMigrationsQuery, useStagesQuery } from './hooks.js'

/** The panel has no i18n, so the browser's locale formats the ISO strings the API returns. */
const formatDateTime = (value: string): string => new Date(value).toLocaleString()

const RefreshButton = ({ onClick }: { onClick: () => void }) => (
	<Button variant="outline" size="sm" onClick={onClick}>
		<RefreshCwIcon className="size-3" />
		<span className="sr-only">Refresh</span>
	</Button>
)

const EmptyLine = ({ children }: { children: string }) => <div className="text-gray-500 italic">{children}</div>

/** Points at the write path this page deliberately does not offer. */
const ExecutedByCliNote = () => (
	<p className="flex items-center gap-2 text-sm text-gray-500">
		<TerminalIcon className="size-3.5 shrink-0" />
		<span>
			Migrations are executed with <code className="font-mono">contember migrations:execute</code>.
		</span>
	</p>
)

const StagesTable = ({ stages }: { stages: readonly DeploymentStage[] }) => {
	if (stages.length === 0) {
		return <EmptyLine>This project has no stages.</EmptyLine>
	}

	return (
		<TableWrapper>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Slug</TableHead>
						<TableHead>Name</TableHead>
						<TableHead>Id</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{stages.map(stage => (
						<TableRow key={stage.id}>
							<TableCell className="font-mono text-xs">{stage.slug}</TableCell>
							<TableCell className="font-medium">{stage.name}</TableCell>
							<TableCell className="font-mono text-xs text-muted-foreground">{stage.id}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</TableWrapper>
	)
}

const StagesSection = () => {
	// `useTenantQueryLoader` is the repo's query loader — generic despite the name — so system reads get the same states.
	const [query, { refresh }] = useTenantQueryLoader(useStagesQuery(), {})
	const nonData = renderConfigQueryState({
		query,
		forbiddenMessage: 'This account may not list the stages of this project.',
		failedMessage: 'Failed to load stages.',
	})

	return (
		<PanelSection
			title="Stages"
			description="Deployment environments of this project. Each one owns a PostgreSQL schema of its own."
			actions={<RefreshButton onClick={refresh} />}
		>
			<div className="relative">
				{query.state === 'refreshing' && <Loader position="absolute" />}
				{nonData ?? ('data' in query ? <StagesTable stages={query.data} /> : null)}
			</div>
		</PanelSection>
	)
}

const MigrationsTable = ({ migrations }: { migrations: readonly ExecutedMigration[] }) => {
	if (migrations.length === 0) {
		return <EmptyLine>No migration has been executed against this project yet.</EmptyLine>
	}
	// Versions are unique and sort chronologically; `executedAt` ties when a project is bootstrapped in one run.
	const newestFirst = [...migrations].sort((a, b) => b.version.localeCompare(a.version))

	return (
		<TableWrapper>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Version</TableHead>
						<TableHead>Name</TableHead>
						<TableHead>Executed at</TableHead>
						<TableHead>Format</TableHead>
						<TableHead>Checksum</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{newestFirst.map(migration => (
						<TableRow key={migration.version}>
							<TableCell className="font-mono text-xs whitespace-nowrap">{migration.version}</TableCell>
							<TableCell className="font-medium">{migration.name}</TableCell>
							<TableCell className="whitespace-nowrap">{formatDateTime(migration.executedAt)}</TableCell>
							<TableCell>{migration.formatVersion ?? '—'}</TableCell>
							<TableCell className="font-mono text-xs text-muted-foreground">{migration.checksum ?? '—'}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</TableWrapper>
	)
}

const MigrationsSection = () => {
	const [query, { refresh }] = useTenantQueryLoader(useExecutedMigrationsQuery(), {})
	const nonData = renderConfigQueryState({
		query,
		forbiddenMessage: 'This account may not list the migrations of this project.',
		failedMessage: 'Failed to load executed migrations.',
	})

	return (
		<PanelSection
			title="Executed migrations"
			description="The registry the current schema was built from, newest first."
			actions={<RefreshButton onClick={refresh} />}
		>
			<div className="relative flex flex-col gap-3">
				{query.state === 'refreshing' && <Loader position="absolute" />}
				<ExecutedByCliNote />
				{nonData ?? ('data' in query ? <MigrationsTable migrations={query.data} /> : null)}
			</div>
		</PanelSection>
	)
}

/**
 * What has been deployed to this project. Read-only on purpose: a schema reaches an engine through
 * the CLI, so the panel reports the result instead of offering a second way in.
 */
export const DeploymentPage = () => (
	<PageStack>
		<PanelSlots.Title>Deployment</PanelSlots.Title>
		<PageHeader
			title="Deployment"
			description="The stages this project runs on, and the migrations that built its current schema."
		/>
		<StagesSection />
		<MigrationsSection />
	</PageStack>
)
