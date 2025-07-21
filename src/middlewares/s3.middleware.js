

import { S3Client } from "@aws-sdk/client-s3";
import env from "../constants/env.constant.js";

const bucketRegion = env.BUCKET_REGION;
const accessId = env.BUCKET_ACCESS_ID;
const secretAccessKey = env.BUCKET_SECRET_ACCESS_KEY;

// Create a client

const s3 = new S3Client({
    credentials: {
        accessKeyId: accessId,
        secretAccessKey: secretAccessKey,
    },
    region: bucketRegion,
});

export default s3;
