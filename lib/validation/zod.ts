import { z } from 'zod';

// Every runtime schema must configure Zod before constructing an object schema.
// Import order otherwise lets acquisition/form schemas trigger an eval probe under CSP.
z.config({ jitless: true });

export { z };
