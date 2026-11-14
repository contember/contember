import type { DepsLintConfig } from 'deptective'

export default {
	globalModules: [],
	ignoredPackages: ['@contember/playground'],
	allowedUnusedDependencies: [
		'@popperjs/core',
		'@aws-sdk/signature-v4-crt',
		'pg',
		// types-only: published declarations import 'pg'
		'@types/pg',
		'graphql',
		'graphql-ts-client-api',
		'react-dom',
	],
	allowedDirectoryImports: [
		'react-dom/client',
		'yawn-yaml/cjs',
		'nodemailer/lib/mailer',
		'nodemailer/lib/smtp-transport',
		'nodemailer/lib/smtp-pool',
		'nodemailer/lib/sendmail-transport',
		'nodemailer/lib/ses-transport',
		'crypto-js/sha256',
		'crypto-js/enc-hex',
	],
} satisfies Partial<DepsLintConfig>
