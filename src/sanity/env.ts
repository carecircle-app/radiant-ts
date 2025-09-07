// src/sanity/env.ts
const rawProjectId = (process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '').trim();
export const projectId = /^[a-z0-9-]+$/.test(rawProjectId) ? rawProjectId : '';

export const dataset = (process.env.NEXT_PUBLIC_SANITY_DATASET || 'production').trim();
export const apiVersion = '2024-01-01'; // keep/adjust to your preferred version
