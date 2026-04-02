import { createClient } from '@insforge/sdk';

const insforgeUrl = import.meta.env.VITE_INSFORGE_URL;
const insforgeAnonKey = import.meta.env.VITE_INSFORGE_ANON_KEY;

if (!insforgeUrl || !insforgeAnonKey) {
  console.warn('InsForge environment variables are missing! Authentication will not work.');
}

export const insforge = createClient({
  baseUrl: insforgeUrl || 'http://localhost',
  anonKey: insforgeAnonKey || 'anon-key'
});
