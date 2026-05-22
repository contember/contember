#!/usr/bin/env node
// Assembles the admin UI library (`admin/lib`) from the Contember UI packages.
//
// Since v2, `@contember/react-ui-lib` is split into three layered packages:
//   - react-ui-lib-base   ui primitives, utils, toast, form primitives, base dict
//   - react-ui-lib-tenant tenant forms/listing/otp (+ tenant dict)
//   - react-ui-lib        the remaining high-level UI, depending on the two above
//
// The project template ships these merged back into a single, fully-owned
// `admin/lib` source tree (so the user can freely customise it). This script is
// the single source of truth for that merge and is used both at package
// pre-build time and by `scripts/update-ui-lib.sh` when updating an existing
// project. It also handles the legacy single-package layout for back-compat.
//
// Layout produced:
//   base/src/*    -> <target>/*          (flat)
//   tenant/src/*  -> <target>/tenant/*
//   main/src/*    -> <target>/*          (flat)
// with the colliding `index.ts` and `form/index.ts` barrels merged, and the
// `@contember/react-ui-lib-base|tenant` imports rewritten to `~/lib`-relative
// paths. `tsconfig.json` files are stripped.
import { existsSync, rmSync, mkdirSync, cpSync, readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const args = process.argv.slice(2)
const getArg = name => {
	const i = args.indexOf(name)
	return i === -1 ? undefined : args[i + 1]
}

const packagesDir = getArg('--packages-dir')
const target = getArg('--target')
if (!packagesDir || !target) {
	console.error('Usage: assemble-ui-lib.mjs --packages-dir <dir> --target <dir>')
	process.exit(1)
}

const mainSrc = join(packagesDir, 'react-ui-lib', 'src')
const baseSrc = join(packagesDir, 'react-ui-lib-base', 'src')
const tenantSrc = join(packagesDir, 'react-ui-lib-tenant', 'src')

if (!existsSync(mainSrc)) {
	console.error(`Source not found: ${mainSrc}`)
	process.exit(1)
}

const isSourceFile = name => name.endsWith('.ts') || name.endsWith('.tsx')

const walk = function* (dir) {
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry)
		if (statSync(full).isDirectory()) {
			yield* walk(full)
		} else {
			yield full
		}
	}
}

const rewriteImports = content =>
	content
		.replaceAll('@contember/react-ui-lib-tenant', '~/lib/tenant')
		.replaceAll('@contember/react-ui-lib-base', '~/lib')

// Reset target.
rmSync(target, { recursive: true, force: true })
mkdirSync(target, { recursive: true })

const split = existsSync(baseSrc) && existsSync(tenantSrc)

if (!split) {
	// Legacy single-package layout: copy the source tree, dropping the package
	// barrel (the project consumes granular `~/lib/*` paths, not a root barrel).
	cpSync(mainSrc, target, { recursive: true })
	rmSync(join(target, 'index.ts'), { force: true })
} else {
	// Base flat into the root, tenant under tenant/, main flat into the root.
	// Main overwrites the colliding `index.ts` and `form/index.ts`; we rebuild
	// those barrels below.
	cpSync(baseSrc, target, { recursive: true })
	cpSync(tenantSrc, join(target, 'tenant'), { recursive: true })
	cpSync(mainSrc, target, { recursive: true })

	// Merge the top-level barrel: inline base's exports and point tenant at the
	// local tenant/ directory, then drop duplicate re-exports.
	const baseIndex = readFileSync(join(baseSrc, 'index.ts'), 'utf8').trim()
	const mainIndex = readFileSync(join(mainSrc, 'index.ts'), 'utf8')
	const mergedIndex = mainIndex
		.replace(/^export \* from '@contember\/react-ui-lib-base'$/m, baseIndex)
		.replace(/^export \* from '@contember\/react-ui-lib-tenant'$/m, "export * from './tenant'")
	const seen = new Set()
	const dedupedIndex = mergedIndex
		.split('\n')
		.filter(line => {
			const trimmed = line.trim()
			if (trimmed.startsWith('export * from') && seen.has(trimmed)) {
				return false
			}
			if (trimmed.startsWith('export * from')) {
				seen.add(trimmed)
			}
			return true
		})
		.join('\n')
	writeFileSync(join(target, 'index.ts'), dedupedIndex)

	// Merge the form barrel: base's form primitives live in form/ui after the
	// flat copy, so re-export them via the local ./ui module.
	const mainFormIndex = readFileSync(join(mainSrc, 'form', 'index.ts'), 'utf8')
	const mergedFormIndex = mainFormIndex.replace(
		/^export \{[^}]*\} from '@contember\/react-ui-lib-base'$/m,
		"export * from './ui'",
	)
	writeFileSync(join(target, 'form', 'index.ts'), mergedFormIndex)
}

// Rewrite package imports to local `~/lib` paths and strip tsconfig files.
for (const file of walk(target)) {
	if (file.endsWith('tsconfig.json')) {
		rmSync(file)
		continue
	}
	if (isSourceFile(file)) {
		const content = readFileSync(file, 'utf8')
		const rewritten = rewriteImports(content)
		if (rewritten !== content) {
			writeFileSync(file, rewritten)
		}
	}
}

console.log(`Assembled admin UI library into ${target} (${split ? 'split' : 'legacy'} layout)`)
