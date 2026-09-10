import type { Config } from '@netlify/functions';

export default async () => {
  return Response.json({
    status: 'ok',
    timestamp: Date.now(),
    service: 'Synapse AI Netlify Function',
  });
};

export const config: Config = {
  path: '/api/health',
  preferStatic: false,
};
