const fs = require('fs');
const yaml = require('js-yaml');


const file = fs.readFileSync('yarn.lock', 'utf8');
const json = yaml.load(file);

const whitelist = ['lodash']
let versions = {};

for (let key in json) {
	if (key === '__metadata') {
		continue;
	}

	const match = key.match(/((@[^/]+\/)?([^@]+))@/)
	if (!match) {
		throw key
	}
	let pkgName = match[1];
	let version = json[key].version;

	if (!versions[pkgName]) {
		versions[pkgName] = new Set();
	}
	versions[pkgName].add(version);
}

let ok = true;
for (let pkg in versions) {
	if (versions[pkg].size > 1 && !whitelist.includes(pkg)) {
		console.error(`Multiple versions found for ${pkg} which is not whitelisted: ${Array.from(versions[pkg]).join(', ')}`);
		ok = false;
	}
}

if (!ok) {
	process.exit(1);
}
