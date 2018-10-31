#!/usr/bin/env node
import { promisify } from 'util'
import * as Knex from 'knex'
import { uuid } from '../utils/uuid'
import Project from '../tenant-api/Project'
import KnexConnection from '../core/knex/KnexConnection'
import StageByIdForUpdateQuery from './model/queries/StageByIdForUpdateQuery'
import KnexQueryable from '../core/knex/KnexQueryable'
import QueryHandler from '../core/query/QueryHandler'
import LatestMigrationByCurrentEventQuery from './model/queries/LatestMigrationByCurrentEventQuery'
import BaseCommand from './BaseCommand'
import CommandConfiguration from '../core/cli/CommandConfiguration'

const fs = require('fs')
const exists = promisify(fs.exists)
const lstat = promisify(fs.lstat)
const readDir = promisify(fs.readdir)
const readFile = promisify(fs.readFile)

const identityId = '11111111-1111-1111-1111-111111111111'

class Initialize {
	constructor(
		private readonly tenantDb: KnexConnection,
		private readonly projectDb: KnexConnection,
		private readonly project: Project,
		private readonly migrationsDir: string
	) {
	}

	public async createOrUpdateProject() {
		await this.tenantDb.wrapper().raw(
			`
			INSERT INTO tenant.project (id, name)
			VALUES (?, ?)
			ON CONFLICT (id) DO UPDATE
			SET name = ?
		`,
			this.project.uuid,
			this.project.name,
			this.project.name
		)
		console.log(`Project ${this.project.slug} updated`)
	}

	public async createInitEvent() {
		const res = await this.projectDb.wrapper().raw(
			`
			INSERT INTO system.event (id, type, data, previous_id)
			VALUES (?, 'init', '{}'::jsonb, NULL)
			ON CONFLICT ON CONSTRAINT unique_init DO NOTHING
		`,
			uuid()
		)
		if (res.rowCount) {
			console.log(`Created init event for project ${this.project.slug}`)
		}
	}

	public async initStages() {
		await Promise.all(
			this.project.stages.map(async stage => {
				await this.createStage(stage)
				await this.runMigrationsForStage(stage)
			})
		)
	}

	private async createStage(stage: Project.Stage) {
		await this.projectDb.transaction(async connection => {
			const initEvent = await connection
				.knex('system.event')
				.where('type', 'init')
				.first()
			await connection.knex.raw(
				`
				INSERT INTO system.stage (id, name, slug, event_id)
				VALUES (:uuid, :name, :slug, :eventId)
				ON CONFLICT (id) DO UPDATE
				SET name = :name, slug = :slug
			`,
				{
					...(stage as any),
					eventId: initEvent.id,
				}
			)
			await connection.wrapper().raw('CREATE SCHEMA IF NOT EXISTS ??', 'stage_' + stage.slug)
			console.log(`Updated stage ${stage.slug} of project ${this.project.slug}`)
		})
	}

	private async runMigrationsForStage(stage: Project.Stage) {
		const migrationPath = this.migrationsDir + '/' + stage.migration + '.sql'
		console.log(migrationPath)
		if (!(await exists(migrationPath)) || !(await lstat(migrationPath)).isFile()) {
			throw new Error(
				`Migration ${stage.migration} does not exist in project ${this.project.slug} (stage ${stage.slug})`
			)
		}

		await this.projectDb.transaction(async knexConnection => {
			const knexWrapper = knexConnection.wrapper()
			await knexWrapper.raw('SELECT set_config(?, ?, false)', 'tenant.identity_id', identityId)

			const handler = new QueryHandler(
				new KnexQueryable(knexConnection, {
					get(): QueryHandler<KnexQueryable> {
						return handler
					},
				})
			)

			const currentStageRow = (await handler.fetch(new StageByIdForUpdateQuery(stage.uuid)))!
			const currentMigration = await handler.fetch(new LatestMigrationByCurrentEventQuery(currentStageRow.event_id))
			const currentMigrationFile = currentMigration === null ? '' : currentMigration.data.file

			if (currentMigrationFile > `${stage.migration}.sql`) {
				throw new Error(
					`Cannot revert to migration ${stage.migration} in project ${this.project.slug} (stage ${
						stage.slug
						}). Current migration is ${currentMigrationFile}`
				)
			}

			await knexWrapper.raw('SET search_path TO ??', 'stage_' + stage.slug)

			const files: string[] = await readDir(this.migrationsDir)

			const migrations = await Promise.all(
				files
					.filter(file => file.endsWith('.sql') && file > currentMigrationFile && file <= `${stage.migration}.sql`)
					.filter(async file => (await lstat(this.migrationsDir + '/' + file)).isFile())
			)

			if (migrations.length === 0) {
				console.log(`No migrations to execute for project ${this.project.slug} (stage ${stage.slug})`)
				return
			}

			let previousId = currentStageRow.event_id
			for (const file of migrations.sort()) {
				const migrationPath = this.migrationsDir + '/' + file
				console.log(`Executing migration ${migrationPath} for project ${this.project.slug} (stage ${stage.slug})`)
				await knexWrapper.raw((await readFile(migrationPath)).toString())
				const newId = uuid()
				await knexConnection.knex('system.event').insert({
					id: newId,
					type: 'run_migration',
					data: {
						file: file,
					},
					previous_id: previousId,
				})
				previousId = newId
			}

			await knexConnection
				.knex('system.stage')
				.where('id', stage.uuid)
				.update({ event_id: previousId })
		})
	}
}

type Args = {
	configFileName: string
	projectsDir: string
}

class InitCommand extends BaseCommand<Args, {}> {
	protected configure(configuration: CommandConfiguration): void {
		configuration.name('init')
	}

	protected async execute(): Promise<void> {
		const config = await this.readConfig()

		const tenantDb = new KnexConnection(
			Knex({
				debug: false,
				client: 'pg',
				connection: config.tenant.db,
			}),
			'tenant'
		)

		await Promise.all(
			config.projects.map(async project => {
				const migrationsDir = `${this.getGlobalOptions().projectsDirectory}/${project.slug}/migrations`
				const projectDb = new KnexConnection(
					Knex({
						debug: false,
						client: 'pg',
						connection: project.dbCredentials,
					}),
					'system'
				)

				await projectDb.wrapper().raw('SELECT set_config(?, ?, false)', 'tenant.identity_id', identityId)

				const init = new Initialize(tenantDb, projectDb, project, migrationsDir)
				await init.createOrUpdateProject()
				await init.createInitEvent()
				await init.initStages()
			})
		)
	}
}

export default InitCommand
