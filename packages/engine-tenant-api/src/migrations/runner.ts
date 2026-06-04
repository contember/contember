import { Connection, createDatabaseIfNotExists, DatabaseConfig, EventManager } from '@contember/database'
import { TenantMigrationArgs } from './types.js'
import { MigrationsRunner as DbMigrationsRunner, SnapshotMigrationResolver } from '@contember/database-migrations'
import _20180802174310init from './2018-08-02-174310-init.js'
import _20180903140621identityproject from './2018-09-03-140621-identity-project.js'
import _20181026165450setupapikey from './2018-10-26-165450-setup-api-key.js'
import _20181026175155variables from './2018-10-26-175155-variables.js'
import _20190218110949projectslug from './2019-02-18-110949-project-slug.js'
import _20190218160155sessionexpiration from './2019-02-18-160155-session-expiration.js'
import _20190503163729apikeydisabledat from './2019-05-03-163729-api-key-disabled-at.js'
import _20190814153300projectslugunique from './2019-08-14-153300-project-slug-unique.js'
import _20190906111000membership from './2019-09-06-111000-membership.js'
import _20190906111001dropoldmember from './2019-09-06-111001-drop-old-member.js'
import _20200129idenitynote from './2020-01-29-idenity-note.js'
import _20200417fixpersonindex from './2020-04-17-fix-person-index.js'
import _20200501170000apikeyindex from './2020-05-01-170000-api-key-index.js'
import _20200608134000tenantcredentials from './2020-06-08-134000-tenant-credentials.js'
import _20200807110000personotp from './2020-08-07-110000-person-otp.js'
import _20200817162200mailtemplates from './2020-08-17-162200-mail-templates.js'
import _20200821143400personpasswordreset from './2020-08-21-143400-person-password-reset.js'
import _20200907094200identityprovider from './2020-09-07-094200-identity-provider.js'
import _20210328134000timestamp from './2021-03-28-134000-timestamp.js'
import _20210726105000projectconfig from './2021-07-26-105000-project-config.js'
import _20210726132000projectsecrets from './2021-07-26-132000-project-secrets.js'
import _20210727174000projectaliasindex from './2021-07-27-174000-project-alias-index.js'
import _20211124130000personpasswordnull from './2021-11-24-130000-person-password-null.js'
import _20211124161500mailtemplateprojectnull from './2021-11-24-161500-mail-template-project-null.js'
import _20220104144000personuniqueidentity from './2022-01-04-144000-person-unique-identity.js'
import _20220209111800fixcrypted from './2022-02-09-111800-fix-crypted.js'
import _20220211153000idpautosignup from './2022-02-11-153000-idp-auto-sign-up.js'
import _20220629105000personidp from './2022-06-29-105000-person-idp.js'
import _20220707135000personemailoptuniq from './2022-07-07-135000-person-email-opt-uniq.js'
import _20220707141000persondisplayname from './2022-07-07-141000-person-display-name.js'
import _20220714145000personloginoptions from './2022-07-14-145000-person-login-options.js'
import _20221108projectupdatenotification from './2022-11-08-project-update-notification.js'
import _20230120135500personemailnormalize from './2023-01-20-135500-person-email-normalize.js'
import _20230603104000persondisabled from './2023-06-03-104000-person-disabled.js'
import _20230901165000idpreturnconfig from './2023-09-01-165000-idp-return-config.js'
import _20240620140000mailreply from './2024-06-20-140000-mail-reply.js'
import _20240826120000passwordless from './2024-08-26-120000-passwordless.js'
import _20250416180000configup from './2025-04-16-180000-config-up.js'
import _20250417160000authlog from './2025-04-17-160000-auth-log.js'
import _20260512120000apikeysessiontracking from './2026-05-12-120000-api-key-session-tracking.js'
import _20260512130000apikeytrustforwardedinfo from './2026-05-12-130000-api-key-trust-forwarded-info.js'
import _20260513120000authlogeventdata from './2026-05-13-120000-auth-log-event-data.js'
import _20260513130000antiabuse from './2026-05-13-130000-anti-abuse.js'
import _20260514100000authlogadminactions from './2026-05-14-100000-auth-log-admin-actions.js'
import _20260515120000configreveallogmethod from './2026-05-15-120000-config-reveal-login-method.js'
import _20260521100000personmfa from './2026-05-21-100000-person-mfa.js'
import _20260521110000mfafoundation from './2026-05-21-110000-mfa-foundation.js'
import _20260521120000emailotp from './2026-05-21-120000-email-otp.js'
import _20260521130000apikeysessionpolicy from './2026-05-21-130000-api-key-session-policy.js'
import _20260521140000mfagraceduration from './2026-05-21-140000-mfa-grace-duration.js'
import _20260521150000emailotpratelimit from './2026-05-21-150000-email-otp-rate-limit.js'
import _20260526120000emailverificationtypes from './2026-05-26-120000-email-verification-types.js'
import _20260526120010emailverification from './2026-05-26-120010-email-verification.js'
import _20260526130000emailchangeverificationconfig from './2026-05-26-130000-email-change-verification-config.js'
import _20260526130010idprequireverifiedemail from './2026-05-26-130010-idp-require-verified-email.js'
import _20260526130020emailverificationratelimit from './2026-05-26-130020-email-verification-rate-limit.js'
import _20260526130030captchaprotectflows from './2026-05-26-130030-captcha-protect-flows.js'
import _20260526140000idpsession from './2026-05-26-140000-idp-session.js'
import snapshot from './snapshot.js'
import { computeTokenHash, Providers } from '../model/index.js'
import { Logger } from '@contember/logger'

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
	'2022-11-08-project-update-notification': _20221108projectupdatenotification,
	'2023-01-20-135500-person-email-normalize': _20230120135500personemailnormalize,
	'2023-06-03-104000-person-disabled': _20230603104000persondisabled,
	'2023-09-01-165000-idp-return-config': _20230901165000idpreturnconfig,
	'2024-06-20-140000-mail-reply': _20240620140000mailreply,
	'2024-08-26-120000-passwordless': _20240826120000passwordless,
	'2025-04-16-180000-config-up': _20250416180000configup,
	'2025-04-17-160000-auth-log': _20250417160000authlog,
	'2026-05-12-120000-api-key-session-tracking': _20260512120000apikeysessiontracking,
	'2026-05-12-130000-api-key-trust-forwarded-info': _20260512130000apikeytrustforwardedinfo,
	'2026-05-13-120000-auth-log-event-data': _20260513120000authlogeventdata,
	'2026-05-13-130000-anti-abuse': _20260513130000antiabuse,
	'2026-05-14-100000-auth-log-admin-actions': _20260514100000authlogadminactions,
	'2026-05-15-120000-config-reveal-login-method': _20260515120000configreveallogmethod,
	'2026-05-21-100000-person-mfa': _20260521100000personmfa,
	'2026-05-21-110000-mfa-foundation': _20260521110000mfafoundation,
	'2026-05-21-120000-email-otp': _20260521120000emailotp,
	'2026-05-21-130000-api-key-session-policy': _20260521130000apikeysessionpolicy,
	'2026-05-21-140000-mfa-grace-duration': _20260521140000mfagraceduration,
	'2026-05-21-150000-email-otp-rate-limit': _20260521150000emailotpratelimit,
	'2026-05-26-120000-email-verification-types': _20260526120000emailverificationtypes,
	'2026-05-26-120010-email-verification': _20260526120010emailverification,
	'2026-05-26-130000-email-change-verification-config': _20260526130000emailchangeverificationconfig,
	'2026-05-26-130010-idp-require-verified-email': _20260526130010idprequireverifiedemail,
	'2026-05-26-130020-email-verification-rate-limit': _20260526130020emailverificationratelimit,
	'2026-05-26-130030-captcha-protect-flows': _20260526130030captchaprotectflows,
	'2026-05-26-140000-idp-session': _20260526140000idpsession,
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
