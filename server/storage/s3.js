const AWS = require('aws-sdk');

class S3Storage {
  constructor(config, log) {
    this.bucket = config.s3_bucket;
    this.log = log;
    const cfg = {};
    if (config.s3_endpoint != '') {
      cfg['endpoint'] = config.s3_endpoint;
    }
    cfg['s3ForcePathStyle'] = config.s3_use_path_style_endpoint;
    this.s3 = new AWS.S3(cfg);
  }

  async length(id) {
    const result = await this.s3
      .headObject({ Bucket: this.bucket, Key: id })
      .promise();
    return Number(result.ContentLength);
  }

  getStream(id) {
    return this.s3
      .getObject({ Bucket: this.bucket, Key: id })
      .createReadStream();
  }

  set(id, file) {
    const upload = this.s3.upload({
      Bucket: this.bucket,
      Key: id,
      Body: file
    });
    file.on('error', () => upload.abort());
    return upload.promise();
  }

  del(id) {
    return this.s3.deleteObject({ Bucket: this.bucket, Key: id }).promise();
  }

  async *list() {
    let ContinuationToken;
    do {
      const result = await this.s3
        .listObjectsV2({ Bucket: this.bucket, ContinuationToken })
        .promise();
      for (const object of result.Contents || []) {
        yield {
          id: object.Key,
          size: Number(object.Size),
          createdAt: object.LastModified.getTime()
        };
      }
      ContinuationToken = result.IsTruncated
        ? result.NextContinuationToken
        : null;
    } while (ContinuationToken);
  }

  ping() {
    return this.s3.headBucket({ Bucket: this.bucket }).promise();
  }
}

module.exports = S3Storage;
