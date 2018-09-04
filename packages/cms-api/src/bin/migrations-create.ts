#!/usr/bin/env node
import { zeroPad } from '../utils/zeroPad'

const fs = require('fs')

const now = new Date()
const year = now.getFullYear()
const month = zeroPad(now.getMonth(), 2)
const day = zeroPad(now.getDay(), 2)
const hours = zeroPad(now.getHours(), 2)
const minutes = zeroPad(now.getMinutes(), 2)
const seconds = zeroPad(now.getSeconds(), 2)
const prefix = `${year}-${month}-${day}-${hours}${minutes}${seconds}`

const type = process.argv[2]
const name = process.argv[3]

if (!['project', 'tenant'].includes(type) || typeof name === 'undefined') {
	console.log(`Usage: node ${process.argv[1]} project|tenant name`)
	process.exit(1)
}

fs.writeFile(`${__dirname}/../../../src/migrations/${type}/${prefix}-${name}.sql`, '', (e: Error) => {
	if (e) throw e
	console.log('ok')
})
