import { Typesafe } from '@contember/engine-common'
import { MailerOptions } from '@contember/engine-tenant-api'
import { upperCaseFirst } from '../utils'


export const dbCredentialsSchema = Typesafe.intersection(
	Typesafe.object({
		host: Typesafe.string,
		port: Typesafe.number,
		user: Typesafe.string,
		password: Typesafe.string,
		database: Typesafe.string,
	}),
	Typesafe.partial({
		ssl: Typesafe.boolean,
	}),
)

export const tenantConfigSchema = Typesafe.intersection(
	Typesafe.object({
		db: dbCredentialsSchema,
		mailer: Typesafe.transform(Typesafe.partial({
			from: Typesafe.string,
			host: Typesafe.string,
			port: Typesafe.number,
			user: Typesafe.string,
			password: Typesafe.string,
		}), (value, input): MailerOptions => {
			return {
				...(input as MailerOptions),
				...value,
				...(value.user ? { auth: { user: value.user, pass: value.password } } : {}),
			}
		}),
		credentials: Typesafe.partial({
			rootToken: Typesafe.string,
			rootTokenHash: Typesafe.string,
			rootPassword: Typesafe.string,
			rootEmail: Typesafe.string,
			loginToken: Typesafe.string,
		}),
	}),
	Typesafe.object({
		secrets: Typesafe.partial({
			encryptionKey: Typesafe.string,
		}),
	}),
)
export const serverConfigSchema = Typesafe.intersection(
	Typesafe.object({
		port: Typesafe.number,
		monitoringPort: Typesafe.number,
		http: Typesafe.partial({
			requestBodySize: Typesafe.string,
		}),
		logging: Typesafe.union(
			val => Typesafe.valueAt(val, ['sentry', 'dsn']) === undefined ? {} : Typesafe.fail([]),
			Typesafe.partial({
				sentry: Typesafe.object({
					dsn: Typesafe.string,
				}),
			}),
		),
	}),
	Typesafe.partial({
		workerCount: Typesafe.union(Typesafe.number, Typesafe.string),
		projectGroup: (val, path) => Typesafe.valueAt(val, ['domainMapping']) === undefined ? undefined : Typesafe.object({
			domainMapping: Typesafe.string,

		})(val, path),
	}),
)
export const configSchema = Typesafe.object({
	tenant: tenantConfigSchema,
	server: serverConfigSchema,
})

export const stageConfig = Typesafe.map(Typesafe.object({
	name: Typesafe.union(
		Typesafe.string,
		(_, path = []) => upperCaseFirst(String(path[path.length - 2])),
	),
	slug: (_, path = []) => String(path[path.length - 2]),
}))

export const projectConfigSchema = Typesafe.object({
	name: Typesafe.union(
		Typesafe.string,
		(_, path = []) => upperCaseFirst(String(path[path.length - 2])).replace(/-/g, ' '),
	),
	slug: (_, path = []) => String(path[path.length - 2]),
	stages: (input, path = []) => Object.values(stageConfig(input, path)),
	db: dbCredentialsSchema,
})
