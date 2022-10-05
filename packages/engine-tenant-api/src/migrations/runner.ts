import { Connection, createDatabaseIfNotExists, DatabaseConfig, EventManager } from '@contember/database'
import { TenantMigrationArgs } from './types'
import { MigrationsRunner as DbMigrationsRunner, SnapshotMigrationResolver } from '@contember/database-migrations'
import _20180802174310init from './2018-08-02-174310-init'
import _20180903140621identityproject from './2018-09-03-140621-identity-project'
import _20181026165450setupapikey from './2018-10-26-165450-setup-api-key'
import _20181026175155variables from './2018-10-26-175155-variables'
import _20190218110949projectslug from './2019-02-18-110949-project-slug'
import _20190218160155sessionexpiration from './2019-02-18-160155-session-expiration'
import _20190503163729apikeydisabledat from './2019-05-03-163729-api-key-disabled-at'
import _20190814153300projectslugunique from './2019-08-14-153300-project-slug-unique'
import _20190906111000membership from './2019-09-06-111000-membership'
import _20190906111001dropoldmember from './2019-09-06-111001-drop-old-member'
import _20200129idenitynote from './2020-01-29-idenity-note'
import _20200417fixpersonindex from './2020-04-17-fix-person-index'
import _20200501170000apikeyindex from './2020-05-01-170000-api-key-index'
import _20200608134000tenantcredentials from './2020-06-08-134000-tenant-credentials'
import _20200807110000personotp from './2020-08-07-110000-person-otp'
import _20200817162200mailtemplates from './2020-08-17-162200-mail-templates'
import _20200821143400personpasswordreset from './2020-08-21-143400-person-password-reset'
import _20200907094200identityprovider from './2020-09-07-094200-identity-provider'
import _20210328134000timestamp from './2021-03-28-134000-timestamp'
import _20210726105000projectconfig from './2021-07-26-105000-project-config'
import _20210726132000projectsecrets from './2021-07-26-132000-project-secrets'
import _20210727174000projectaliasindex from './2021-07-27-174000-project-alias-index'
import _20211124130000personpasswordnull from './2021-11-24-130000-person-password-null'
import _20211124161500mailtemplateprojectnull from './2021-11-24-161500-mail-template-project-null'
import _20220104144000personuniqueidentity from './2022-01-04-144000-person-unique-identity'
import _20220209111800fixcrypted from './2022-02-09-111800-fix-crypted'
import _20220211153000idpautosignup from './2022-02-11-153000-idp-auto-sign-up'
import _20220629105000personidp from './2022-06-29-105000-person-idp'
import _20220707135000personemailoptuniq from './2022-07-07-135000-person-email-opt-uniq'
import _20220707141000persondisplayname from './2022-07-07-141000-person-display-name'
import _20220714145000personloginoptions from './2022-07-14-145000-person-login-options'
import snapshot from './snapshot'
import { computeTokenHash, Providers } from '../model'
import { Logger } from '@contember/logger'
import { MigrationVersionHelper } from '@contember/engine-common'

export interface TenantCredentials {
	loginToken?: string
	rootEmail?: string
	rootToken?: string
	rootTokenHash?: string
	rootPassword?: string
}

const migrations = {
	'2018-08-02-174310-init': _20180802174310init,
	'2018-09-03-140621-identity-project': _20180903140621identityproject,
	'2018-10-26-165450-setup-api-key': _20181026165450setupapikey,
	'2018-10-26-175155-variables': _20181026175155variables,
	'2019-02-18-110949-project-slug': _20190218110949projectslug,
	'2019-02-18-160155-session-expiration': _20190218160155sessionexpiration,
	'2019-05-03-163729-api-key-disabled-at': _20190503163729apikeydisabledat,
	'2019-08-14-153300-project-slug-unique': _20190814153300projectslugunique,
	'2019-09-06-111000-membership': _20190906111000membership,
	'2019-09-06-111001-drop-old-member': _20190906111001dropoldmember,
	'2020-01-29-idenity-note': _20200129idenitynote,
	'2020-04-17-fix-person-index': _20200417fixpersonindex,
	'2020-05-01-170000-api-key-index': _20200501170000apikeyindex,
	'2020-06-08-134000-tenant-credentials': _20200608134000tenantcredentials,
	'2020-08-07-110000-person-otp': _20200807110000personotp,
	'2020-08-17-162200-mail-templates': _20200817162200mailtemplates,
	'2020-08-21-143400-person-password-reset': _20200821143400personpasswordreset,
	'2020-09-07-094200-identity-provider': _20200907094200identityprovider,
	'2021-03-28-134000-timestamp': _20210328134000timestamp,
	'2021-07-26-105000-project-config': _20210726105000projectconfig,
	'2021-07-26-132000-project-secrets': _20210726132000projectsecrets,
	'2021-07-27-174000-project-alias-index': _20210727174000projectaliasindex,
	'2021-11-24-130000-person-password-null': _20211124130000personpasswordnull,
	'2021-11-24-161500-mail-template-project-null': _20211124161500mailtemplateprojectnull,
	'2022-01-04-144000-person-unique-identity': _20220104144000personuniqueidentity,
	'2022-02-09-111800-fix-crypted': _20220209111800fixcrypted,
	'2022-02-11-153000-idp-auto-sign-up': _20220211153000idpautosignup,
	'2022-06-29-105000-person-idp': _20220629105000personidp,
	'2022-07-07-135000-person-email-opt-uniq': _20220707135000personemailoptuniq,
	'2022-07-07-141000-person-display-name': _20220707141000persondisplayname,
	'2022-07-14-145000-person-login-options': _20220714145000personloginoptions,
}

export class TenantMigrationsRunner {
	constructor(
		private readonly db: DatabaseConfig,
		private readonly schema: string,
		private readonly tenantCredentials: TenantCredentials,
		private readonly providers: Pick<Providers, 'bcrypt' | 'uuid'>,
	) {
	}

	public async run(logger: Logger): Promise<{ name: string }[]> {
		await createDatabaseIfNotExists(this.db, message => typeof message === 'string' ? logger.warn(message) : logger.error(message))
		const connection = Connection.createSingle(this.db, err => logger.error(err))
		const result = await connection.scope(async connection => {
			const migrationsResolver = new SnapshotMigrationResolver(snapshot, migrations)

			const innerRunner = new DbMigrationsRunner<TenantMigrationArgs>(connection, this.schema, migrationsResolver)
			return await innerRunner.migrate(message => logger.warn(message), {
				getCredentials: async () => ({
					loginTokenHash: this.tenantCredentials.loginToken ? computeTokenHash(this.tenantCredentials.loginToken) : undefined,
					rootTokenHash: this.tenantCredentials.rootTokenHash
						?? (this.tenantCredentials.rootToken ? computeTokenHash(this.tenantCredentials.rootToken) : undefined),
					rootEmail: this.tenantCredentials.rootEmail,
					rootPasswordBcrypted: this.tenantCredentials.rootPassword ? await this.providers.bcrypt(this.tenantCredentials.rootPassword) : undefined,
				}),
				providers: this.providers,
			})
		})
		await connection.end()
		return result
	}
}
