const requiredEnv = [
  'BUCKET_NAME',
  'BUCKET_ENDPOINT',
  'BUCKET_REGION',
  'BUCKET_ACCESS_KEY_ID',
  'BUCKET_SECRET_ACCESS_KEY',
  'BUCKET_DOWNLOAD_URL',
];

const optionalEnv = ['BUCKET_USE_KV', 'KV_CACHE_TTL_SEC', 'ALLOW_SE_INDEX'];

export const ensureEnv = (): void => {
  requiredEnv.forEach((env) => {
    if (!import.meta.env[env]) {
      throw new Error(`${env} is required`);
    }
  });
  optionalEnv.forEach((env) => {
    if (!import.meta.env[env]) {
      // do-nothing
      // for some reason, the env is not if doesn't check
    }
  });
};

export const getEnv = (name: string, defaultValue?: string): string => {
  const env = import.meta.env[name] || process.env[name] || defaultValue;
  if (env === undefined) {
    throw new Error(`${name} is required`);
  }
  return env;
};
