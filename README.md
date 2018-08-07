# Use Google Drive from the command line
Install NodeJs and npm to use this package.

## Installation
Install globally from npm:

```
npm install gdrive-backup -g
```

## Prerequesits
Create an application on Google Drive to get the credentials.json that needs to
be sent with each request.

[https://developers.google.com/drive/api/v3/quickstart/nodejs#step_1_turn_on_the](Access Google Api Authorization)

Click *Enable the Drive Api* button to create an application and download your credentials.


## Usage
Currently the following three commands are available (all on the root location):
* Upload a file
* Download a file
* List files

### Upload a file
```
gdrive-backup upload testupload.txt -c mycredentials.json
```
Help:
```
Usage: upload [options] <file>

Options:

  -c, --credentials <credentials.json>  set credentials file path. defaults to "credentials.json"
  -t, --upload-type <type>              set upload type. defaults to "resumable"
  --token-code <code>                   set token code needed to authorize the app
  -h, --help                            output usage information
```
### Download a file
```
gdrive-backup download 1SZZy40xTPPMJG1pMl3ikpULVg5VKE5rq -c mycredentials.json -d testupload.txt
```
Help:
```
Usage: download [options] <id>

Options:

  -d, --dest <file>                     set destination file (required)
  -c, --credentials <credentials.json>  set credentials file path. defaults to "credentials.json"
  -t, --upload-type <type>              set upload type. defaults to "resumable"
  --token-code <code>                   set token code needed to authorize the app
  -h, --help                            output usage information
```
### List files
```
gdrive-backup list -c mycredentials.json
```
Help:
```
Usage: list [options]

Options:

  -o, --order-by <orderBy>              set order of files. defaults to "modifiedTime"
  -c, --credentials <credentials.json>  set credentials file path. defaults to "credentials.json"
  --token-code <code>                   set token code needed to authorize the app
  -h, --help                            output usage information
```

# Next Steps
* Support Folder upload
* Make tutorial about backup (download latest file from specific folder)
* Instruction steps for token verification
* Name files automatically
* Compression
* Encryption
