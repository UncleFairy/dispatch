import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// vitest doesn't expose test globals by default, so Testing Library's
// auto-cleanup-on-afterEach never registers itself; wire it up explicitly so
// each component test starts from an empty DOM.
afterEach(() => cleanup());
