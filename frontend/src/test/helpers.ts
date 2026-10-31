/** Replace global fetch for one test (setup.ts restores it afterwards). */
export const stubFetch = (impl: unknown) => {
  globalThis.fetch = impl as typeof fetch;
};
