# MERN Product Catalog

A small React + Express + MongoDB product catalog that stores product images in a private S3 bucket.

## Requirements

- Node.js 18 or later and npm
- MongoDB running locally or a MongoDB Atlas connection string
- An AWS account and an S3 bucket

## Start the application

1. Configure the API:

   ```sh
   cd server
   cp .env.example .env
   # Set MONGODB_URI, AWS_REGION, and S3_BUCKET in .env
   npm install
   npm run dev
   ```

   For MongoDB Atlas, set `MONGODB_URI` to your Atlas connection string with `/test` as the database path, for example:

   ```text
   mongodb+srv://<username>:<url-encoded-password>@<cluster-host>/test?retryWrites=true&w=majority
   ```

   Replace the placeholders with your Atlas database user and cluster host. Do not paste real credentials into source files or chat. Atlas creates the `test` database and the `products` collection automatically when the first product is inserted; you do not need to create a table or collection manually. Confirm the API IP is permitted in Atlas Network Access.

2. In a second terminal, start the React app:

   ```sh
   cd client
   cp .env.example .env
   npm install
   npm run dev
   ```

3. Open the Vite URL printed in the client terminal (normally `http://localhost:5173`).

The API listens on `http://localhost:5000` by default.

## Image upload flow

1. React asks `POST /api/uploads/presign` for a presigned S3 PUT URL.
2. React uploads the selected image directly to S3.
3. React sends the product fields and returned `imageKey` to `POST /api/products`.
4. The API saves the product fields and S3 key in MongoDB.
5. `GET /api/products` signs a short-lived S3 GET URL for each image and returns it with the product.

The bucket stays private; do not make it public to use this setup.

## AWS setup and required credentials

Set these API environment variables in `server/.env`:

| Variable | Description |
| --- | --- |
| `AWS_REGION` | AWS region containing the S3 bucket, e.g. `us-east-1` |
| `S3_BUCKET` | Name of the S3 bucket |
| `AWS_ACCESS_KEY_ID` | IAM access key ID (only if not using an AWS role/profile) |
| `AWS_SECRET_ACCESS_KEY` | IAM secret access key (only if not using an AWS role/profile) |

The AWS SDK automatically uses the standard credential chain. For local development, you may use environment credentials or an AWS CLI profile; in production, prefer an IAM role and do not store long-lived keys in source control or frontend variables.

The API needs both `s3:PutObject` (to authorize uploads) and `s3:GetObject` (to verify uploads and display them with signed read URLs). Scope them to your bucket's `products/*` objects:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/products/*"
    }
  ]
}
```

Keep S3 Block Public Access enabled. Configure the bucket's CORS rules to allow the frontend origin and browser PUT uploads. For local development, use:

```json
[
  {
    "AllowedOrigins": ["http://localhost:5173"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

If deploying the frontend on another origin, replace/add that exact origin in the bucket's CORS configuration and set `CLIENT_ORIGIN` in the API environment.

## API endpoints

- `GET /api/health` — health check
- `GET /api/products` — list products with signed image URLs
- `POST /api/uploads/presign` — request a short-lived image upload URL
- `POST /api/products` — create a product after its image upload

Images are limited to JPEG, PNG, WebP, and GIF, up to 10 MB.
