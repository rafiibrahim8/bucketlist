# bucketlist

List any S3 compatible bucket's content as an index page.

## Usage

Clone the repository and run the following command:

```bash
git clone git@github.com:rafiibrahim8/bucketlist.git
cd bucketlist
```

Install the required packages:

```bash
pnpm install
```

Copy the `.env.example` file to `.env` and fill in the required information:

Run the application:

```bash
pnpm start
```

## Using Cloudflare KV

Normally listing all content of a bucket is an expensive operation. To reduce the cost, you can use Cloudflare KV to cache the bucket's content. To use Cloudflare KV, you need to have a Cloudflare account and a KV namespace.

To run the application with Cloudflare KV, it needs [wrangler](https://developers.cloudflare.com/workers/cli-wrangler/install-update) installed.

You need to copy the `wrangler.toml.example` file to `wrangler.toml` and fill in the required information.

Environment variables:
| Name | Description | Required |
|------|-------------|----------|
| `BUCKET_NAME` | The name of the bucket. | Yes |
| `BUCKET_ENDPOINT` | The endpoint of the bucket. | Yes |
| `BUCKET_REGION` | The region of the bucket. | Yes |
| `BUCKET_ACCESS_KEY_ID` | The access key ID of the bucket. | Yes |
| `BUCKET_SECRET_ACCESS_KEY` | The secret access key of the bucket. | Yes |
| `BUCKET_DOWNLOAD_URL` | A publicly accessible URL to download the object. | Yes |
| `BUCKET_USE_KV` | Set to `true` to use Cloudflare KV. Default is `false`. | No |
| `KV_CACHE_TTL_SEC` | The time-to-live of the cache in seconds. Default is 6 hours. | No |
| `ALLOW_SE_INDEX` | Set to `true` to allow search engine indexing. Default is `false`. | No |

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements
[CaddyServer](https://github.com/caddyserver) for their [html template](https://github.com/caddyserver/caddy/blob/master/modules/caddyhttp/fileserver/browse.html) for listing the bucket's content.
