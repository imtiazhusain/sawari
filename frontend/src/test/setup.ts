import '@testing-library/jest-dom';
import 'whatwg-fetch'; // jsdom has no fetch/Response; this adds them
import { cleanup } from '@testing-library/react';

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  globalThis.fetch = originalFetch; // undo any per-test fetch stub
});
