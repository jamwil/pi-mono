#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const WORKSPACE_ORDER = ["packages/ai", "packages/tui", "packages/agent", "packages/coding-agent"];

const HELP_TEXT = `Usage:
  node scripts/fork-release.mjs plan --workspaces packages/coding-agent
  node scripts/fork-release.mjs publish --workspaces packages/ai,packages/agent,packages/coding-agent [--dry-run] [--dist-tag latest] [--branch patched]

Commands:
  plan     Print the normalized publish order, package names, version, and suggested fork tag.
  publish  Publish only the selected workspaces in dependency order. Use --dry-run first.

Options:
  --workspaces <paths>  Comma-separated workspace paths.
  --dist-tag <tag>      npm dist-tag to use for publish. Defaults to latest.
  --branch <name>       Expected release branch. Defaults to patched.
  --dry-run             Pass --dry-run through to npm publish.
  --help                Show this message.

Notes:
  - Supported workspaces: ${WORKSPACE_ORDER.join(", ")}
  - This script never stages, commits, or pushes git changes.
  - Suggested fork tag format: fork/pi/v<version>.
  - Multiple selected workspaces must already share the same version.
`;

function fail(message) {
	console.error(message);
	process.exit(1);
}

function parseArgs(argv) {
	const options = {
		workspaces: [],
		distTag: "latest",
		branch: "patched",
		dryRun: false,
		help: false,
	};

	for (let index = 0; index < argv.length; index++) {
		const arg = argv[index];

		if (arg === "--help") {
			options.help = true;
			continue;
		}

		if (arg === "--dry-run") {
			options.dryRun = true;
			continue;
		}

		if (arg === "--workspaces") {
			const value = argv[index + 1];
			if (!value) {
				fail("Missing value for --workspaces");
			}
			options.workspaces.push(...value.split(","));
			index++;
			continue;
		}

		if (arg.startsWith("--workspaces=")) {
			options.workspaces.push(...arg.slice("--workspaces=".length).split(","));
			continue;
		}

		if (arg === "--dist-tag") {
			const value = argv[index + 1];
			if (!value) {
				fail("Missing value for --dist-tag");
			}
			options.distTag = value;
			index++;
			continue;
		}

		if (arg.startsWith("--dist-tag=")) {
			options.distTag = arg.slice("--dist-tag=".length);
			continue;
		}

		if (arg === "--branch") {
			const value = argv[index + 1];
			if (!value) {
				fail("Missing value for --branch");
			}
			options.branch = value;
			index++;
			continue;
		}

		if (arg.startsWith("--branch=")) {
			options.branch = arg.slice("--branch=".length);
			continue;
		}

		fail(`Unknown argument: ${arg}`);
	}

	options.workspaces = [...new Set(options.workspaces.map((workspace) => workspace.trim()).filter(Boolean))];
	return options;
}

function normalizeWorkspaces(workspaces) {
	if (workspaces.length === 0) {
		fail("At least one workspace must be provided via --workspaces");
	}

	for (const workspace of workspaces) {
		if (!WORKSPACE_ORDER.includes(workspace)) {
			fail(
				`Unsupported workspace: ${workspace}. Supported workspaces: ${WORKSPACE_ORDER.join(", ")}`
			);
		}
	}

	return WORKSPACE_ORDER.filter((workspace) => workspaces.includes(workspace));
}

function readWorkspace(workspace) {
	const packageJsonPath = join(workspace, "package.json");
	if (!existsSync(packageJsonPath)) {
		fail(`Missing package.json for workspace: ${workspace}`);
	}

	const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
	return {
		workspace,
		name: packageJson.name,
		version: packageJson.version,
	};
}

function getCurrentBranch() {
	return execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { encoding: "utf8" }).trim();
}

function getReleaseVersion(workspaces) {
	const versions = [...new Set(workspaces.map((workspace) => workspace.version))];
	if (versions.length !== 1) {
		fail(
			`Selected workspaces must share one version. Found: ${versions.join(", ")}`
		);
	}
	return versions[0];
}

function printPlan(workspaces, distTag, branch, currentBranch) {
	const version = getReleaseVersion(workspaces);
	console.log(`Release branch: ${branch}`);
	console.log(`Current branch: ${currentBranch}`);
	console.log(`npm dist-tag: ${distTag}`);
	console.log(`Suggested git tag: fork/pi/v${version}`);
	console.log("Publish order:");
	for (const workspace of workspaces) {
		console.log(`  - ${workspace.workspace}: ${workspace.name}@${workspace.version}`);
	}
	return version;
}

function publish(workspaces, distTag, dryRun) {
	for (const workspace of workspaces) {
		const args = ["publish", "--access", "public", "--tag", distTag];
		if (dryRun) {
			args.push("--dry-run");
		}
		console.log(`\n$ (cd ${workspace.workspace} && npm ${args.join(" ")})`);
		execFileSync("npm", args, { cwd: workspace.workspace, stdio: "inherit" });
	}
}

function main() {
	const [command, ...rest] = process.argv.slice(2);
	if (!command || command === "--help") {
		console.log(HELP_TEXT);
		return;
	}

	if (!["plan", "publish"].includes(command)) {
		fail(`Unknown command: ${command}`);
	}

	const options = parseArgs(rest);
	if (options.help) {
		console.log(HELP_TEXT);
		return;
	}

	const normalizedWorkspaces = normalizeWorkspaces(options.workspaces).map(readWorkspace);
	const currentBranch = getCurrentBranch();
	printPlan(normalizedWorkspaces, options.distTag, options.branch, currentBranch);

	if (command === "plan") {
		return;
	}

	if (currentBranch !== options.branch) {
		if (!options.dryRun) {
			fail(`Refusing to publish from ${currentBranch}. Switch to ${options.branch} first.`);
		}
		console.warn(`Dry run is executing from ${currentBranch}. Real publishes must run from ${options.branch}.`);
	}

	publish(normalizedWorkspaces, options.distTag, options.dryRun);
}

main();
