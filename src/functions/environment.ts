const requiredEnv = [
  'BUCKET_NAME',
  'BUCKET_ENDPOINT',
  'BUCKET_REGION',
  'BUCKET_ACCESS_KEY_ID',
  'BUCKET_SECRET_ACCESS_KEY',
  'BUCKET_DOWNLOAD_URL',
];

const optionalEnv = ['BUCKET_USE_KV', 'KV_CACHE_TTL_SEC', 'ALLOW_SE_INDEX'];

export const copyEnv = (workerEnv?: Record<string, string>): void => {
  if (!workerEnv) {
    return;
  }
  process.env['BUCKET_NAME'] =
    process.env['BUCKET_NAME'] || workerEnv['BUCKET_NAME'];
  process.env['BUCKET_ENDPOINT'] =
    process.env['BUCKET_ENDPOINT'] || workerEnv['BUCKET_ENDPOINT'];
  process.env['BUCKET_REGION'] =
    process.env['BUCKET_REGION'] || workerEnv['BUCKET_REGION'];
  process.env['BUCKET_ACCESS_KEY_ID'] =
    process.env['BUCKET_ACCESS_KEY_ID'] || workerEnv['BUCKET_ACCESS_KEY_ID'];
  process.env['BUCKET_SECRET_ACCESS_KEY'] =
    process.env['BUCKET_SECRET_ACCESS_KEY'] ||
    workerEnv['BUCKET_SECRET_ACCESS_KEY'];
  process.env['BUCKET_DOWNLOAD_URL'] =
    process.env['BUCKET_DOWNLOAD_URL'] || workerEnv['BUCKET_DOWNLOAD_URL'];
  process.env['BUCKET_USE_KV'] =
    process.env['BUCKET_USE_KV'] || workerEnv['BUCKET_USE_KV'];
  process.env['KV_CACHE_TTL_SEC'] =
    process.env['KV_CACHE_TTL_SEC'] || workerEnv['KV_CACHE_TTL_SEC'];
  process.env['ALLOW_SE_INDEX'] =
    process.env['ALLOW_SE_INDEX'] || workerEnv['ALLOW_SE_INDEX'];
};

export const ensureEnv = (): void => {
  requiredEnv.forEach((env) => {
    if (!import.meta.env[env] && !process.env[env]) {
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
  return env.toString();
};
