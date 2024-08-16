const {exec} = require('child_process')
const core = require('@actions/core')

const parseVersion = (version) => {
	const match = version.match(/^(refs\/tags\/)?v?(?<major>[0-9]+)\.(?<minor>[0-9]+)\.(?<patch>[0-9]+)(-(?<prerelease>[a-z]+)\.(?<prereleaseVersion>[0-9]+))?$/)
	if (!match) {
		return null
	}
	return {
		major: Number(match.groups.major),
		minor: Number(match.groups.minor),
		patch: Number(match.groups.patch),
		prerelease: match.groups.prerelease,
		prereleaseVersion: match.groups.prereleaseVersion ? Number(match.groups.prereleaseVersion) : -1,
	}
}
(() => {
	const inputVersion = core.getInput('version', {required: true})
	const version = parseVersion(inputVersion)
	if (!version) {
		return
	}
	exec('git tag -l', (err, stdout) => {
		if (err) {
			throw err
		}
		const gitVersions = stdout.split("\n").map(parseVersion).filter(it => !!it)
		const sameIsStable = gitVersions.filter(it => !!it.prerelease === !!version.prerelease)
		const latestMajor = sameIsStable.length > 0 ? Math.max(...sameIsStable.map(it => it.major)) : -1
		const sameMajor = sameIsStable.filter(it => it.major === version.major)
		const latestMinor = sameMajor.length > 0 ? Math.max(...sameMajor.map(it => it.minor)) : -1
		const sameMinor = sameMajor.filter(it => it.minor === version.minor)
		const latestPatch = sameMinor.length > 0 ? Math.max(...sameMinor.map(it => it.patch)) : -1
		const samePatchAndStability = sameMinor.filter(it => it.patch === version.patch && it.prerelease === version.prerelease)
		const latestPrereleaseVersion = version.prerelease && samePatchAndStability.length > 0 ? Math.max(...samePatchAndStability.map(it => it.prereleaseVersion)) : -1

		const isLatestMajor = latestMajor <= version.major
		const isLatestMinor = latestMinor <= version.minor
		const isLatestPatch = latestPatch <= version.patch
		const isLatestPrereleaseVersion = latestPrereleaseVersion <= version.prereleaseVersion


		const stabilitySuffix = version.prerelease ? `-${version.prerelease}` : ''
		let npmTag = 'bump'
		const latestVersions = []
		if (version.prerelease) {
			latestVersions.push(`${version.major}.${version.minor}.${version.patch}-${version.prerelease}.${version.prereleaseVersion}`)
		}
		latestVersions.push(`${version.major}.${version.minor}.${version.patch}${stabilitySuffix}`)
		if (isLatestPrereleaseVersion && isLatestPatch) {
			latestVersions.push(`${version.major}.${version.minor}${stabilitySuffix}`)
			if (isLatestMinor) {
				latestVersions.push(`${version.major}${stabilitySuffix}`)
				if (isLatestMajor) {
					npmTag = version.prerelease ? 'next' : 'latest'
				}
			}
		}
		core.setOutput('npmTag', npmTag)
		core.setOutput('versions', latestVersions.join(" "))
	})
})()
