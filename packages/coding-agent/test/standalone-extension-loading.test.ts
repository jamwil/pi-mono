import { afterAll, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => {
	const originalMarker = process.env.PI_STANDALONE_BUNDLE;
	process.env.PI_STANDALONE_BUNDLE = "1";
	return {
		originalMarker,
		createJiti: vi.fn((_id: unknown, _options: unknown) => ({
			import: vi.fn(async () => () => {}),
		})),
	};
});

vi.mock("jiti/static", () => ({ createJiti: state.createJiti }));

import { loadExtensions } from "../src/core/extensions/loader.ts";

interface JitiOptionsProbe {
	alias?: unknown;
	tryNative?: boolean;
	virtualModules?: Record<string, unknown>;
}

afterAll(() => {
	if (state.originalMarker === undefined) {
		delete process.env.PI_STANDALONE_BUNDLE;
	} else {
		process.env.PI_STANDALONE_BUNDLE = state.originalMarker;
	}
});

describe("standalone extension loading", () => {
	it("uses embedded compatibility modules instead of filesystem aliases", async () => {
		const result = await loadExtensions(["/extension.ts"], "/");

		expect(result.errors).toEqual([]);
		expect(result.extensions).toHaveLength(1);
		expect(state.createJiti).toHaveBeenCalledOnce();

		const options = state.createJiti.mock.calls[0][1] as JitiOptionsProbe;
		expect(options.tryNative).toBe(false);
		expect(options.alias).toBeUndefined();
		expect(options.virtualModules?.typebox).toBeDefined();
		expect(options.virtualModules?.["@earendil-works/pi-ai"]).toBeDefined();
		expect(options.virtualModules?.["@earendil-works/pi-tui"]).toBeDefined();
		expect(options.virtualModules?.["@earendil-works/pi-coding-agent"]).toBeDefined();
	});
});
