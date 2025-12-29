#!/usr/bin/env bun

import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { $ } from "bun";

interface Resources {
	d1DatabaseName: string;
	r2BucketName: string;
	kvNamespaceName: string;
	kvBindingName: string;
}

interface CreatedResources {
	d1Id: string;
	kvId: string;
}

interface D1Database {
	uuid: string;
	name: string;
	created_at: string;
	version: string;
	num_tables: number;
	file_size: number;
	jurisdiction: string | null;
}

interface R2Bucket {
	name: string;
}

interface KVNamespace {
	id: string;
	title: string;
}

async function updatePackageJson(applicationName: string) {
	const rootPackageJson = readFileSync("package.json", "utf-8");
	const rootPackageJsonJson = JSON.parse(rootPackageJson);
	rootPackageJsonJson.name = `${applicationName.trim()}`;
	writeFileSync("package.json", JSON.stringify(rootPackageJsonJson, null, 2));
	console.log(`Updated package.json`);

	const workerPackageJson = readFileSync("worker/package.json", "utf-8");
	const workerPackageJsonJson = JSON.parse(workerPackageJson);
	workerPackageJsonJson.name = `${applicationName.trim()}-worker`;
	writeFileSync(
		"worker/package.json",
		JSON.stringify(workerPackageJsonJson, null, 2),
	);
	console.log(`Updated worker/package.json`);

	const frontendPackageJson = readFileSync("frontend/package.json", "utf-8");
	const frontendPackageJsonJson = JSON.parse(frontendPackageJson);
	frontendPackageJsonJson.name = `${applicationName.trim()}-frontend`;
	writeFileSync(
		"frontend/package.json",
		JSON.stringify(frontendPackageJsonJson, null, 2),
	);
	console.log(`Updated frontend/package.json`);

	await $`bun install`;
}

async function createD1(databaseName: string): Promise<string> {
	console.log(`Creating D1 database: ${databaseName}...`);

	// List existing databases
	const d1ListOutput = await $`wrangler d1 list --json`.text();
	const d1List: D1Database[] = JSON.parse(d1ListOutput);
	const existingDb = d1List.find((db) => db.name === databaseName);

	if (existingDb) {
		console.log(`D1 Database already exists. ID: ${existingDb.uuid}`);
		return existingDb.uuid;
	}

	// Create the database
	await $`wrangler d1 create ${databaseName}`;
	console.log(`D1 Database created: ${databaseName}`);

	// List again to get the ID
	const d1ListOutputAfter = await $`wrangler d1 list --json`.text();
	const d1ListAfter: D1Database[] = JSON.parse(d1ListOutputAfter);
	const newDb = d1ListAfter.find((db) => db.name === databaseName);

	if (!newDb) {
		throw new Error("Failed to find D1 database after creation");
	}

	console.log(`D1 Database ID: ${newDb.uuid}`);

	await $`bun run db:migrate:prod`;
	console.log(`Migrations applied to D1 Database: ${databaseName}`);

	return newDb.uuid;
}

async function createR2(bucketName: string): Promise<string> {
	console.log(`Creating R2 bucket: ${bucketName}...`);

	// Try to get info on the bucket (will throw if it doesn't exist)
	try {
		const r2BucketInfo =
			await $`wrangler r2 bucket info ${bucketName} --json`.text();
		const r2BucketInfoJson = JSON.parse(r2BucketInfo) as R2Bucket;
		console.log(`R2 Bucket already exists: ${r2BucketInfoJson.name}`);
		return r2BucketInfoJson.name;
	} catch {}

	// Bucket doesn't exist, create it
	await $`wrangler r2 bucket create ${bucketName}`;
	console.log(`R2 Bucket created: ${bucketName}`);

	const r2BucketInfo =
		await $`wrangler r2 bucket info ${bucketName} --json`.text();
	const r2BucketInfoJson = JSON.parse(r2BucketInfo) as R2Bucket;
	console.log(`R2 Bucket created: ${r2BucketInfoJson.name}`);
	return r2BucketInfoJson.name;
}

async function createKV(namespaceName: string): Promise<string> {
	console.log(`Creating KV namespace: ${namespaceName}...`);

	// Try to list namespaces and find if it exists
	try {
		const kvListOutput = await $`wrangler kv namespace list`.text();
		const kvList: KVNamespace[] = JSON.parse(kvListOutput);
		const existingKv = kvList.find((ns) => ns.title === namespaceName);

		if (existingKv) {
			console.log(`KV Namespace already exists. ID: ${existingKv.id}`);
			return existingKv.id;
		}
	} catch {
		// Ignore error
	}

	await $`wrangler kv namespace create ${namespaceName}`;
	console.log(`KV Namespace created: ${namespaceName}`);

	const kvListOutput = await $`wrangler kv namespace list`.text();
	const kvList: KVNamespace[] = JSON.parse(kvListOutput);
	const newKv = kvList.find((ns) => ns.title === namespaceName);

	if (!newKv) {
		throw new Error("Failed to find KV namespace after creation");
	}

	console.log(`KV Namespace ID: ${newKv.id}`);
	return newKv.id;
}

function updateWranglerToml(
	wranglerFile: string,
	resources: Resources,
	createdResources: CreatedResources,
	_applicationName: string,
): void {
	console.log(`Updating ${wranglerFile}...`);

	// Backup original file
	copyFileSync(wranglerFile, `${wranglerFile}.bak`);

	let wranglerContent = readFileSync(wranglerFile, "utf-8");

	// Update name
	wranglerContent = wranglerContent.replace(
		/name = "[^"]*"/,
		`name = "${_applicationName}"`,
	);

	// Update D1 database_id
	wranglerContent = wranglerContent.replace(
		/database_id = "[^"]*"/,
		`database_id = "${createdResources.d1Id}"`,
	);

	// Update D1 database_name
	wranglerContent = wranglerContent.replace(
		/database_name = "[^"]*"/,
		`database_name = "${resources.d1DatabaseName}"`,
	);

	// Update R2 bucket_name
	wranglerContent = wranglerContent.replace(
		/bucket_name = '[^']*'/,
		`bucket_name = '${resources.r2BucketName}'`,
	);

	// Update KV namespace id (look for the specific binding)
	wranglerContent = wranglerContent.replace(
		new RegExp(`(binding = "${resources.kvBindingName}"[^\\]]*id = ")[^"]*"`),
		`$1${createdResources.kvId}"`,
	);

	writeFileSync(wranglerFile, wranglerContent);

	console.log(`Updated ${wranglerFile}`);
	console.log(`Backup saved to ${wranglerFile}.bak`);
}

function printSummary(
	resources: Resources,
	createdResources: CreatedResources,
): void {
	console.log("Resource Summary:");
	console.log(`D1 Database: ${resources.d1DatabaseName}`);
	console.log(`D1 Database ID: ${createdResources.d1Id}`);
	console.log(`R2 Bucket: ${resources.r2BucketName}`);
	console.log(`KV Namespace: ${resources.kvNamespaceName}`);
	console.log(`KV Namespace ID: ${createdResources.kvId}`);
	console.log("All resources created successfully!");

	console.log("IMPORTANT: Commit and push the changes to your repository");
}

// Get application name from user
process.stdout.write("Enter your application name: ");
let APPLICATION_NAME = "";
for await (const line of console) {
	APPLICATION_NAME = line;
	break;
}

APPLICATION_NAME = APPLICATION_NAME.trim();

if (!APPLICATION_NAME || APPLICATION_NAME === "") {
	console.error("Error: Application name cannot be empty");
	process.exit(1);
}

// Resource configuration
const RESOURCES: Resources = {
	d1DatabaseName: `${APPLICATION_NAME}`,
	r2BucketName: `${APPLICATION_NAME}`,
	kvNamespaceName: `${APPLICATION_NAME}-session-cache`,
	kvBindingName: "SESSION_CACHE",
};

await updatePackageJson(APPLICATION_NAME);

const WRANGLER_FILE = "./worker/wrangler.toml";

console.log("Creating Cloudflare resources...");

try {
	const d1Id = await createD1(RESOURCES.d1DatabaseName);
	await createR2(RESOURCES.r2BucketName);
	const kvId = await createKV(RESOURCES.kvNamespaceName);

	const createdResources: CreatedResources = {
		d1Id,
		kvId,
	};

	updateWranglerToml(
		WRANGLER_FILE,
		RESOURCES,
		createdResources,
		APPLICATION_NAME,
	);
	printSummary(RESOURCES, createdResources);
} catch (error) {
	const errorMessage = error instanceof Error ? error.message : String(error);
	console.error("Error:", errorMessage);

	if (error && typeof error === "object" && "stderr" in error) {
		const stderr = error.stderr as { toString(): string } | undefined;
		if (stderr) {
			console.error(stderr.toString());
		}
	}

	if (error && typeof error === "object" && "stdout" in error) {
		const stdout = error.stdout as { toString(): string } | undefined;
		if (stdout) {
			console.error(stdout.toString());
		}
	}

	process.exit(1);
}
