#!/usr/bin/env node

import { Client } from 'pg'
;(async () => {
	const wrapIdentifier = (value: string) => '"' + value.replace(/"/g, '""') + '"'
	const connection = new Client({
		host: process.env.TENANT_DB_HOST,
		port: Number(process.env.TENANT_DB_PORT),
		user: process.env.TENANT_DB_USER,
		password: process.env.TENANT_DB_PASSWORD,
		database: 'postgres',
	})
	await connection.connect()
	await connection.query(`DROP DATABASE IF EXISTS ${wrapIdentifier(String(process.env.TENANT_DB_NAME))}`)
	await connection.query(`DROP DATABASE IF EXISTS ${wrapIdentifier(String(process.env.APP_DB_NAME))}`)
	await connection.end()
})().catch(e => {
	console.error(e)
	process.exit(1)
})
