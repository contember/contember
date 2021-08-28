import { GraphQLResolveInfo } from 'graphql'
import { ResolverContext } from '../ResolverContext'
import { MutationResolver } from '../Resolver'
import {
	MigrationDeleteErrorCode,
	MigrationDeleteResponse,
	MigrationModifyErrorCode,
	MigrationModifyResponse,
	MutationMigrationDeleteArgs,
	MutationMigrationModifyArgs,
} from '../../schema'
import { DeleteMigrationErrorCode, MigrationAlterer, UpdateMigrationErrorCode } from '../../model'
import { Migration } from '@contember/schema-migrations'

export class MigrationAlterMutationResolver implements MutationResolver<'migrationModify'>, MutationResolver<'migrationDelete'> {

	constructor(private readonly migrationAlterer: MigrationAlterer) {}

	async migrationModify(
		parent: any,
		args: MutationMigrationModifyArgs,
		context: ResolverContext,
		info: GraphQLResolveInfo,
	): Promise<MigrationModifyResponse> {
		const result = await this.migrationAlterer.modifyMigration(
			context.db,
			args.migration,
			args.modification as Partial<Migration>,
		)
		if (result.ok) {
			return {
				ok: true,
			}
		}
		const code = {
			[UpdateMigrationErrorCode.notFound]: MigrationModifyErrorCode.NotFound,
		}[result.error]
		return { ok: false, error: { code, developerMessage: result.errorMessage } }
	}

	async migrationDelete(
		parent: any,
		args: MutationMigrationDeleteArgs,
		context: ResolverContext,
		info: GraphQLResolveInfo,
	): Promise<MigrationDeleteResponse> {
		const result = await this.migrationAlterer.deleteMigration(context.db, args.migration)
		if (result.ok) {
			return {
				ok: true,
			}
		}
		const code = {
			[DeleteMigrationErrorCode.notFound]: MigrationDeleteErrorCode.NotFound,
		}[result.error]
		return { ok: false, error: { code, developerMessage: result.errorMessage } }
	}
}
