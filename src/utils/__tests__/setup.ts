import { afterEach, vi, beforeAll } from 'vitest';

// Setup localStorage mock
beforeAll(() => {
  const localStorageMock = {
    getItem: vi.fn((key: string) => {
      return null;
    }),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  };

  global.localStorage = localStorageMock as unknown as Storage;
});

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
});
