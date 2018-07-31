# Use Google Drive from the command line
Install NodeJs and npm to use this package.

## Installation
Install globally from npm:

```npm install google-drive-shell -g```

## Usage

```
google-drive-shell download 1SZZy40xTPPMJG1pMl3ikpULVg5VKE5rq -c mycredentials.json -d testupload.txt
```

### Upload a file
```
google-drive-shell upload testupload.txt -c mycredentials.json
```
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
google-drive-shell download 1SZZy40xTPPMJG1pMl3ikpULVg5VKE5rq -c mycredentials.json -d testupload.txt
```
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
google-drive-shell list -c mycredentials.json
```
```
Usage: list [options]

Options:

  -o, --order-by <orderBy>              set order of files. defaults to "modifiedTime"
  -c, --credentials <credentials.json>  set credentials file path. defaults to "credentials.json"
  --token-code <code>                   set token code needed to authorize the app
  -h, --help                            output usage information
```
