import { builtinModules } from "node:module";
import { chmod, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(packageDir, "dist", "standalone");
const outputFile = path.join(outputDir, "cli.mjs");
const packageJsonPath = path.join(packageDir, "package.json");

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

const result = await build({
	entryPoints: [path.join(packageDir, "dist", "bun", "cli.js")],
	bundle: true,
	platform: "node",
	target: "node24",
	format: "esm",
	outfile: outputFile,
	metafile: true,
	legalComments: "none",
	logOverride: { "ignored-bare-import": "silent" },
	banner: {
		js: 'import { createRequire as __createRequire } from "node:module"; const require = __createRequire(import.meta.url);',
	},
	plugins: [
		{
			name: "disable-optional-modules",
			setup(buildContext) {
				buildContext.onResolve({ filter: /^(bufferutil|supports-color|utf-8-validate)$/ }, ({ path: specifier }) => ({
					path: specifier,
					namespace: "standalone-optional-module",
				}));
				buildContext.onLoad({ filter: /.*/, namespace: "standalone-optional-module" }, ({ path: specifier }) => ({
					contents: `throw new Error(${JSON.stringify(`${specifier} is not included in the standalone build`)});`,
					loader: "js",
				}));
			},
		},
	],
});

const builtins = new Set([...builtinModules, ...builtinModules.map((name) => `node:${name}`)]);
const externalImports = Object.values(result.metafile.outputs)
	.flatMap((output) => output.imports)
	.filter((imported) => imported.external && !builtins.has(imported.path));
if (externalImports.length > 0) {
	throw new Error(
		`Standalone bundle has external package imports: ${[...new Set(externalImports.map(({ path }) => path))].join(", ")}`,
	);
}

const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
await writeFile(
	path.join(outputDir, "package.json"),
	`${JSON.stringify(
		{
			name: packageJson.name,
			version: packageJson.version,
			type: "module",
			piConfig: packageJson.piConfig,
		},
		null,
		2,
	)}\n`,
);

const themeOutputDir = path.join(outputDir, "dist", "modes", "interactive", "theme");
await mkdir(themeOutputDir, { recursive: true });
for (const theme of ["dark.json", "light.json"]) {
	await cp(path.join(packageDir, "src", "modes", "interactive", "theme", theme), path.join(themeOutputDir, theme));
}

await chmod(outputFile, 0o755);
console.log(`Built standalone Node CLI at ${path.relative(packageDir, outputFile)}`);
