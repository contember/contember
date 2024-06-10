---
title: Data export and import
---

Data transfer API and CLI tools allows exporting and importing data between projects.

# Data transfer CLI

The most convenient way to use transfer API are following CLI commands.

## Data export
The `data:export` allows you to export data from a Contember project to a file. This can be useful for creating backups of your data or for transferring data between projects.

To use the `data:export` command, open a terminal window and navigate to the root directory of your Contember project. Then, enter the following command:

```
npm run contember data:export [source-project]
```
The source project argument is optional. If you leave it blank, the command will export data from the local project. If you want to export data from a remote project, you can specify the project using a DSN format like `contember://project:token@apiurl`. 

For example:
```
npm run contember data:export contember://my-blog:0000abcd@api-my-blog.eu.contember.cloud
```

You can also use the following options with the data:export command:

- `--no-gzip`: This option allows you to skip compressing the output file. By default, the output file will be compressed using gzip.

- `--include-system`: This option includes system schema (with event log) in the export.

- `--output` This option allows you to specify the name of the output file. By default, the file will be named `project-name.jsonl` (or `project-name.jsonl.gz` if the output is compressed).

For example, to export data from a local project without compressing the output and including system schema data, you could use the following command:

```
npm run contember data:export -- --no-gzip --include-system --output my-project-data.jsonl
```
This would export the data from the local project to a file named my-project-data.jsonl.

## Data import

The `data:import` allows you to import data from a file into a Contember project. This can be useful for restoring data from a backup or for transferring data between projects.

To use the `data:import` command, open a terminal window and navigate to the root directory of your Contember project. Then, enter the following command:

```
npm run contember data:import <input-file> [target-project]
```
The input file argument should be the path to the file containing the data you want to import. The target project argument is optional. If you leave it blank, the command will import the data into the local project. If you want to import the data into a remote project, you can specify the project using a DSN format like `contember://project:token@apiurl`. 

For example:
```
npm run contember data:import ./my-project-data.jsonl contember://my-blog:0000abcd@api-my-blog.eu.contember.cloud
```
When you run the `data:import` command, you will be prompted to confirm the import. This is because the import process will overwrite any existing data in the target project. You can use the `--yes` option to skip this confirmation prompt.

For example, to import data from a file into a local project without being prompted to confirm the import, you could use the following command:

```
npm run contember data:import ./my-project-data.jsonl -- --yes
```

This would import the data from the file `my-project-data.jsonl` into the local project, overwriting any existing data.

## Data transfer

The `data:transfer` allows you to transfer data directly between two Contember projects. This can be useful for transferring data between production and staging environments, or for moving data between different teams or projects.

To use the `data:transfer` command, open a terminal window and navigate to the root directory of your Contember project. Then, enter the following command:
```
npm run contember data:transfer <source-project> <target-project>
```
The source project and target project arguments should be the projects you want to transfer data between. You can specify a local project using a dot `.`, or a remote project using a DSN format like `contember://project:token@apiurl` 

For example:
```
npm run contember data:transfer . contember://my-blog:0000abcd@api-my-blog.eu.contember.cloud
```
This would transfer data from the local project to the remote project specified in the DSN.

You can also use the following options with the data:transfer command:
- `--include-system` This option includes system schema data in the transfer.
- `--yes` This option skips the confirmation prompt.

For example, to transfer data from a remote project to a local project without being prompted to confirm the transfer and including system schema, you could use the following command:

```
npm run contember data:transfer contember://my-blog:0000abcd@api-my-blog.eu.contember.cloud . -- --include-system --yes
```
This would transfer data from the remote project specified in the DSN to the local project, overwriting any existing data.

# Data transfer HTTP API

HTTP endpoints can be useful if you want to automate data management tasks or integrate Contember with other tools and systems.

## Data export

The `/export` endpoint in Contember allows you to export data from a Contember project using an HTTP request.

To use the `/export` endpoint, you will need to send a POST request to the endpoint with a bearer token in the `Authorization` header and a JSON body containing the list of projects you want to export. The body should be in the following format:

```json
{
	"projects": [
		{ "slug": "project-name", "system": false }
	]
}
```
To include system schema in the export, set the system field to true. The export will be in "JSON lines" format, with one JSON object per line.

#### Example how to use the `/export` endpoint with CURL:

```bash
curl --request POST \
	--url https://your-api/export \
	--header 'Authorization: Bearer your-token' \
	--header 'Content-Type: application/json' \
	--output exported-data.jsonl \
	--data '{
		"projects": [
			{ "slug": "project-name", "system": false }
		]
	}'
```
This will send a POST request to the `/export` endpoint with a bearer token in the `Authorization` header and a JSON body specifying the project you want to export. The exported data will be returned in the response body.

You can also use the `Content-Encoding: gzip` header to enable gzip compression for the export. 

# Data import

The `/import` endpoint in Contember allows you to import data into a Contember project using an HTTP request.

To use the `/import` endpoint, you will need to send a POST request to the endpoint with the exported data in the request body and a bearer token in the `Authorization` header. The `Content-Type` header should be set to `application/x-ndjson`. The target project for the import is contained in the exported file, but you can change it by modifying the file or by specifying the `targetSlug` field in the export.

#### Example of to use the `/import` endpoint with CURL:

```
curl --request POST \
	--url https://your-api/import \
	--header 'Authorization: Bearer your-token' \
	--header 'Content-Type: application/x-ndjson' \
	--data exported-data.jsonl
```
This will send a POST request to the `/import` endpoint with a bearer token in the `Authorization` header and the exported data in the request body. The Content-Type header is set to application/x-ndjson, which is the correct format for the exported data.

You should also set the `Content-Encoding: gzip` header when the exported file is gzip encoded.

## Permissions

The ability to import and export data is controlled by user roles and their permissions. By default, the `admin` and `content_admin` roles have the ability to import and export data. However, you can modify these permissions by setting the `import` and `export` keys to `true` or `false` in the `content` or `system` section of the role configuration.

For example, to grant the editor role the ability to export data but not import it, you could use following configuration:

```typescript
export const editorRole = acl.createRole('editor', {
	// ...
	content: {
		export: true,
		import: false,
	}
})
```
