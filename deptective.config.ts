import type { DepsLintConfig } from 'deptective'

export default {
	globalModules: ['vitest'],
	ignoredPackages: ['@contember/playground'],
	allowedUnusedDependencies: [
		'@popperjs/core',
		'@aws-sdk/signature-v4-crt',
		'pg',
		'uuid',
		'graphql',
		'lodash-es',
		'graphql-ts-client-api',
		'react-dom',
	],
	allowedDirectoryImports: [
		'fast-deep-equal/es6/index.js',
		'react-dom/client',
		'yawn-yaml/cjs',
		'nodemailer/lib/mailer',
		'nodemailer/lib/smtp-transport',
		'nodemailer/lib/smtp-pool',
		'nodemailer/lib/sendmail-transport',
		'nodemailer/lib/ses-transport',
		'crypto-js/sha256',
		'crypto-js/enc-hex',
		'node-pg-migrate/dist/utils.js',
		'node-pg-migrate/dist/migration-builder.js',
	],
} satisfies Partial<DepsLintConfig>
