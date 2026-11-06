import { describe, it, expect } from "vitest";
import { herdrAppClient } from "../src/commands/terminal.js";

const inApp = { HC_TERMINAL_ID: "t4", HC_TERMINAL_SOCKET: "/run/core.sock", HERDR_APP_HOME: "/apps/h" };
const deps = (env: NodeJS.ProcessEnv, configured = "auto", socket = true) => ({
  env, configuredProvider: () => configured, socketExists: (p: string) => socket && p === "/apps/h/herdr-app.sock",
}) as Parameters<typeof herdrAppClient>[1];

describe("rig terminal open: when herdr-app is the target", () => {
  it("--provider herdr-app, with this terminal as origin and herdr-app's home", () => {
    expect(herdrAppClient({ provider: "herdr-app" }, deps(inApp))).toEqual({ appHome: "/apps/h", originTerminal: "t4" });
    expect(herdrAppClient({ provider: "herdr-app", appHome: "/x", originTerminal: "t9" }, deps({}))).toEqual({ appHome: "/x", originTerminal: "t9" });
  });

  it("with neither --provider nor --window: a herdr-app terminal whose window socket exists, or terminal.provider", () => {
    expect(herdrAppClient({}, deps(inApp))).toMatchObject({ appHome: "/apps/h" });
    expect(herdrAppClient({}, deps({ HERDR_APP_HOME: "/apps/h" }, "herdr-app"))).toEqual({ appHome: "/apps/h" });
    expect(herdrAppClient({}, deps(inApp, "auto", false))).toBeNull(); // markers alone invent no endpoint
  });

  it("an explicit terminal.provider wins over a herdr-app terminal; only auto lets the terminal choose", () => {
    for (const configured of ["herdr-legacy", "herdr", "cmux"]) expect(herdrAppClient({}, deps(inApp, configured))).toBeNull();
    expect(herdrAppClient({}, deps(inApp, ""))).toMatchObject({ appHome: "/apps/h" }); // unset reads as auto
  });

  it("--window and other named providers keep their meaning", () => {
    expect(herdrAppClient({ window: true }, deps(inApp, "herdr-app"))).toBeNull();
    expect(herdrAppClient({ provider: "herdr" }, deps(inApp, "herdr-app"))).toBeNull();
    expect(herdrAppClient({ provider: "cmux" }, deps(inApp))).toBeNull();
  });
});
