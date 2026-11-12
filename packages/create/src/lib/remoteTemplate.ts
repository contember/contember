import { mkdir } from 'node:fs/promises'
import { promisify } from 'node:util'
import { gunzip } from 'node:zlib'
import { extractTar, parseTar } from './tar.js'

export type TemplateHost = 'github' | 'gitlab' | 'bitbucket' | 'git.sr.ht'

export interface RemoteTemplateSource {
	readonly host: TemplateHost
	readonly user: string
	readonly name: string
	readonly subdir: readonly string[]
	/** A branch, tag or commit; `HEAD` is the default branch. */
	readonly ref: string
}

const hosts: ReadonlySet<string> = new Set(['github', 'gitlab', 'bitbucket', 'git.sr.ht'])
const isTemplateHost = (value: string): value is TemplateHost => hosts.has(value)

// The source grammar of degit 2.8.4: `[host:|https://host/|git@host:]user/repo[/subdir][#ref]`.
const sourcePattern = /^(?:(?:https:\/\/)?([^:/]+\.[^:/]+)\/|git@([^:/]+)[:/]|([^/]+):)?([^/\s]+)\/([^/\s#]+)(?:((?:\/[^/\s#]+)+))?(?:\/)?(?:#(.+))?/

const isSafeSegment = (segment: string): boolean => segment !== '' && segment !== '.' && segment !== '..'

export const parseTemplateSource = (source: string): RemoteTemplateSource => {
	const match = sourcePattern.exec(source)
	if (!match) {
		throw new Error(`Could not parse template source ${JSON.stringify(source)}`)
	}
	const host = (match[1] ?? match[2] ?? match[3] ?? 'github').replace(/\.(com|org)$/, '')
	if (!isTemplateHost(host)) {
		throw new Error('Remote templates are supported from GitHub, GitLab, Bitbucket and Sourcehut')
	}
	const user = match[4]
	const name = match[5].replace(/\.git$/, '')
	const subdir = (match[6] ?? '').split('/').filter(it => it !== '')
	const ref = match[7] ?? 'HEAD'
	if (![user, name, ...subdir, ...ref.split('/')].every(isSafeSegment)) {
		throw new Error(`Could not parse template source ${JSON.stringify(source)}`)
	}
	return { host, user, name, subdir, ref }
}

export const templateArchiveUrl = ({ host, user, name, ref }: RemoteTemplateSource): string => {
	const repo = `${encodeURIComponent(user)}/${encodeURIComponent(name)}`
	const path = ref.split('/').map(encodeURIComponent).join('/')
	switch (host) {
		case 'github':
			return `https://github.com/${repo}/archive/${path}.tar.gz`
		case 'gitlab':
			return `https://gitlab.com/${repo}/-/archive/${path}/${encodeURIComponent(`${name}-${ref.split('/').join('-')}`)}.tar.gz`
		case 'bitbucket':
			return `https://bitbucket.org/${repo}/get/${path}.tar.gz`
		case 'git.sr.ht':
			return `https://git.sr.ht/${repo}/archive/${path}.tar.gz`
	}
}

/** Generous for a project template; it bounds what a hostile or broken archive can make us buffer or write. */
const maxArchiveBytes = 64 * 1024 * 1024
const maxExtractedBytes = 512 * 1024 * 1024

const readBody = async (response: Response, url: string): Promise<Uint8Array> => {
	const declared = Number(response.headers.get('content-length'))
	if (declared > maxArchiveBytes) {
		throw new Error(`Template archive ${url} is larger than ${maxArchiveBytes} bytes`)
	}
	if (!response.body) {
		return new Uint8Array()
	}
	const chunks: Uint8Array[] = []
	let total = 0
	for await (const chunk of response.body) {
		total += chunk.length
		if (total > maxArchiveBytes) {
			throw new Error(`Template archive ${url} is larger than ${maxArchiveBytes} bytes`)
		}
		chunks.push(chunk)
	}
	return Buffer.concat(chunks)
}

export type Fetch = (url: string, init: RequestInit) => Promise<Response>

const maxRedirects = 5

/** Follows redirects by hand, so that every hop, not only the last one, has to stay on HTTPS. */
const fetchOverHttps = async (url: string, fetchArchive: Fetch): Promise<Response> => {
	let current = url
	for (let hop = 0;; hop++) {
		let response: Response
		try {
			response = await fetchArchive(current, { redirect: 'manual' })
		} catch (error) {
			throw new Error(`Could not download ${current}: ${error}. Behind a proxy, Node needs NODE_USE_ENV_PROXY=1 with HTTPS_PROXY.`)
		}
		if (response.status < 300 || response.status >= 400) {
			if (!response.ok) {
				throw new Error(`Could not download ${current}: HTTP ${response.status}`)
			}
			return response
		}
		const location = response.headers.get('location')
		if (location === null || hop >= maxRedirects) {
			throw new Error(`Could not download ${url}: too many or invalid redirects`)
		}
		const next = new URL(location, current)
		if (next.protocol !== 'https:') {
			throw new Error(`Could not download ${url}: redirected to a non-HTTPS location`)
		}
		current = next.href
	}
}

/** Downloads the source's archive over HTTPS and extracts it (or its subdirectory) into `targetDir`. */
export const downloadTemplate = async (source: string, targetDir: string, fetchArchive: Fetch = fetch): Promise<void> => {
	const parsed = parseTemplateSource(source)
	const url = templateArchiveUrl(parsed)
	const response = await fetchOverHttps(url, fetchArchive)
	const compressed = await readBody(response, url)
	let archive: Uint8Array
	try {
		archive = await promisify(gunzip)(compressed, { maxOutputLength: maxExtractedBytes })
	} catch (error) {
		throw new Error(`Template archive ${url} is not a readable gzip file (or exceeds ${maxExtractedBytes} bytes): ${error}`)
	}
	await mkdir(targetDir, { recursive: true })
	// Every host wraps the repository in one top-level directory.
	await extractTar(parseTar(archive), targetDir, { strip: 1, subdir: parsed.subdir })
}
