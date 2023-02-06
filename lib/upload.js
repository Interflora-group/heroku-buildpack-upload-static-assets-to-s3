const AWS = require('aws-sdk');
const glob = require('glob');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const async = require('async');
const mimeTypes = require('mime-types');

function getEnv(name) {
  return process.env[name] || fs.readFileSync(path.join(process.env.ENV_DIR, name), {encoding: 'utf8'});
}

try {
  // AWS.config.logger = process.stdout;
  AWS.config.maxRetries = 10;

  AWS.config.accessKeyId = getEnv('AWS_ACCESS_KEY_ID');
  AWS.config.secretAccessKey = getEnv('AWS_SECRET_ACCESS_KEY');
  AWS.config.region = getEnv('AWS_DEFAULT_REGION');

  // bucket where static assets are uploaded to
  const AWS_STATIC_BUCKET_NAME = getEnv('AWS_STATIC_BUCKET_NAME');
  // the source directory of static assets
  const AWS_STATIC_SOURCE_DIRECTORY = getEnv('AWS_STATIC_SOURCE_DIRECTORY');
  // the folder to upload the files into
  const AWS_STATIC_PREFIX = getEnv('AWS_STATIC_PREFIX')

  const BUILD_DIR = process.env.BUILD_DIR;
  // location of public assets in the heroku build environment
  const PUBLIC_ASSETS_SOURCE_DIRECTORY = path.join(BUILD_DIR, AWS_STATIC_SOURCE_DIRECTORY);
  // location that the assets should upload in s3
  const STATIC_PATH = AWS_STATIC_PREFIX;

  glob(PUBLIC_ASSETS_SOURCE_DIRECTORY + '/**/*.*', {}, function (error, files) {
      if (error || !files) {
        return process.exit(1);
      }

      console.log('Files to Upload:', files.length);
      console.time('Upload Complete In');

      const yearInMs = 365 * 24 * 60 * 60000;
      const yearFromNow = Date.now() + yearInMs;

      const s3 = new AWS.S3();
      async.eachLimit(files, 16, function (file, callback) {
          const stat = fs.statSync(file);
          if (!stat.isFile()) {
            console.log('Not a file', file);
            return callback(null);
          }

          let contentType = mimeTypes.lookup(path.extname(file)) || null;
          if (!_.isString(contentType)) {
            console.warn('Unknown ContentType:', contentType, file);
            contentType = 'application/octet-stream';
          }

          s3.upload({
            ACL: 'public-read',
            Key: path.join(STATIC_PATH, file.replace(PUBLIC_ASSETS_SOURCE_DIRECTORY, '')),
            Body: fs.createReadStream(file),
            Bucket: AWS_STATIC_BUCKET_NAME,
            Expires: new Date(yearFromNow),
            CacheControl: 'public,max-age=' + yearInMs + ',smax-age=' + yearInMs,
            ContentType: contentType
          }, callback)

        },
        function onUploadComplete(error) {
          console.timeEnd('Upload Complete In');

          if (error) {
            console.error('Static Uploader failed to upload to S3');
            console.error(error);
            console.error('Exiting without error');
            process.exit(0);
          }

          process.exit(0);
        });
    }
  );
} catch (error) {
  console.error('Static Uploader is not configured for this deploy');
  console.error(error);
  console.error('Exiting without error');
  process.exit(0);
}


