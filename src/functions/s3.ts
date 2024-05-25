import * as AWS from '@aws-sdk/client-s3';
import type { _Object } from '@aws-sdk/client-s3';
import {
  concatArrays,
  lstrip,
  parseDate,
  parseIntOr,
  rstrip,
  strip,
  toHumanReadableSize,
} from './utils';
import { getEnv } from './environment';
import type { KVNamespace } from '@cloudflare/workers-types';

export type Entry =
  | {
      type: 'directory';
      name: string;
      anchor: string;
      lastModified?: Date;
      size?: number;
      humanReadableSize?: string;
    }
  | {
      type: 'file';
      name: string;
      anchor: string;
      fullPath: string;
      lastModified: Date;
      size: number;
      humanReadableSize: string;
      extension: string;
    };

export type FSListing = {
  entries: Entry[];
  numDirectories: number;
  numFiles: number;
};

const getExtension = (filename: string): string => {
  const parts = filename.split('.');
  if (parts.length === 1 || (filename.startsWith('.') && parts.length === 2)) {
    return '';
  }
  return parts[parts.length - 1];
};

const getS3Client = (): AWS.S3 => {
  const region = getEnv('BUCKET_REGION');
  const endpoint = getEnv('BUCKET_ENDPOINT');
  const accessKeyId = getEnv('BUCKET_ACCESS_KEY_ID');
  const secretAccessKey = getEnv('BUCKET_SECRET_ACCESS_KEY');

  return new AWS.S3({
    region,
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
};

const sortAndGetListing = (entries: Entry[]): FSListing => {
  const directories = entries
    .filter((entry) => entry.type === 'directory')
    .sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
  const files = entries
    .filter((entry) => entry.type === 'file')
    .sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
  return {
    entries: concatArrays(directories, files),
    numDirectories: directories.length,
    numFiles: files.length,
  };
};

const objectListToFS = (objects: _Object[], currentPath: string): FSListing => {
  const dlUrl = getEnv('BUCKET_DOWNLOAD_URL');
  const strippedKeyObjects = objects
    .filter((obj) => !!obj.Key)
    .map((obj) => {
      return {
        ...obj,
        Key: '/' + lstrip(obj.Key || '', '/'),
      };
    })
    .filter((obj) => obj.Key?.startsWith(currentPath))
    .map((obj) => {
      return {
        ...obj,
        ShortKey: obj.Key?.substring(currentPath.length) || '',
      };
    });

  const entries = strippedKeyObjects.map((obj): Entry => {
    if (obj.ShortKey?.includes('/')) {
      return {
        type: 'directory',
        anchor: obj.ShortKey.split('/')[0] + '/',
        name: obj.ShortKey.split('/')[0],
      };
    } else {
      return {
        type: 'file',
        anchor: rstrip(dlUrl, '/') + '/' + lstrip(obj.Key || '', '/'),
        name: obj.ShortKey,
        fullPath: obj.Key || '',
        lastModified: parseDate(obj.LastModified),
        size: obj.Size || 0,
        humanReadableSize: toHumanReadableSize(obj.Size || 0),
        extension: getExtension(obj.ShortKey),
      };
    }
  });
  const unsortedEntries = entries.filter((entry, index, self) => {
    return (
      index ===
      self.findIndex((t) => t.type === entry.type && t.name === entry.name)
    );
  });
  return sortAndGetListing(unsortedEntries);
};

const tryGetKVList = async (
  kv?: KVNamespace,
): Promise<_Object[] | undefined> => {
  if (!kv || getEnv('BUCKET_USE_KV', 'false').toLowerCase() !== 'true') {
    return;
  }
  const kvItem = await kv.get(`bucket-list-${getEnv('BUCKET_NAME')}`);
  if (!kvItem) {
    return;
  }
  const kvItemParsed = JSON.parse(kvItem);
  const timeDiff = new Date().getTime() - kvItemParsed.timestamp;
  if (
    timeDiff >
    parseIntOr(getEnv('KV_CACHE_TTL_SEC', '21600'), 21600) * 1000
  ) {
    return;
  }
  return kvItemParsed.list;
};

const tryPutKVList = async (
  list: _Object[],
  kv?: KVNamespace,
): Promise<void> => {
  if (!kv || getEnv('BUCKET_USE_KV', 'false').toLowerCase() !== 'true') {
    return;
  }
  await kv.put(
    `bucket-list-${getEnv('BUCKET_NAME')}`,
    JSON.stringify({
      list,
      timestamp: new Date().getTime(),
    }),
  );
  console.log(`KV list updated for ${getEnv('BUCKET_NAME')} at ${new Date()}`);
};

export const listAllObjects = async (
  bucketName: string,
): Promise<_Object[]> => {
  let isTruncated = true;
  let continuationToken;

  const allObjects: _Object[] = [];
  const client = getS3Client();

  while (isTruncated) {
    const listObjectsResponse: AWS.ListObjectsV2CommandOutput =
      await client.listObjectsV2({
        Bucket: bucketName,
        ContinuationToken: continuationToken,
      });

    if (listObjectsResponse.Contents) {
      allObjects.push(...listObjectsResponse.Contents);
    }

    isTruncated = listObjectsResponse.IsTruncated || false;
    continuationToken = listObjectsResponse.NextContinuationToken;
  }
  return allObjects;
};

export const listBucket = async (
  path: string,
  kv?: KVNamespace,
): Promise<FSListing> => {
  const bucketName = getEnv('BUCKET_NAME');
  const normalizedPathT = '/' + strip(path, '/') + '/';
  const normalizedPath = normalizedPathT === '//' ? '/' : normalizedPathT;

  if (!kv && getEnv('BUCKET_USE_KV', 'false').toLowerCase() === 'true') {
    throw new Error(
      'KV namespace is required. Make sure you have configured it in wrangler.toml',
    );
  }

  const kvList = await tryGetKVList(kv);
  if (kvList !== undefined) {
    console.log(`Using KV list for ${bucketName} at ${new Date()}`);
    return objectListToFS(kvList, normalizedPath);
  }

  console.log(`Fetching bucket list for ${bucketName} at ${new Date()}`);
  const allObjects = await listAllObjects(bucketName);
  await tryPutKVList(allObjects, kv);
  return objectListToFS(allObjects, normalizedPath);
};
