# Purpose 📄

> Uploads static assets to S3 when building Heroku apps.

# Requirements 💽

* NodeJS build pack to be installed. `https://github.com/heroku/heroku-buildpack-nodejs`

# Installation ⌨️

```
heroku buildpacks:set https://github.com/Interflora-group/heroku-buildpack-upload-static-assets-to-s3
```

### Configure environment
```
AWS_ACCESS_KEY_ID=<aws access key id>
AWS_SECRET_ACCESS_KEY=<aws secret access key>
AWS_DEFAULT_REGION=<aws-region>
AWS_STATIC_BUCKET_NAME=<s3-bucket-name>
# The directory to upload to S3 (uploads the content of the directory)
AWS_STATIC_SOURCE_DIRECTORY=public
```
