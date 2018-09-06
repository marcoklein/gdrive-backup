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
* Authorization with Google Drive
* Backup (upload) of a file
* Download of a backed up file

If a folder has to be backed up tar or similar compression programs should be used.

### Backup a file
I file is uploaded using the *backup* option. The second argument adds a tag
to the backup that is used to retrieve the backup.
```
gdrive-backup backup testupload.txt testtag -c mycredentials.json
```
Help:
```
Usage: backup [options] <path> <name>

Backup a specific folder with a backup name tag.

Options:

	-c, --credentials-path <credentials-path>  set [credentials-path] file path (default: credentials.json)
	-t, --token-path <token>                   set [token] file path (default: token.json)
	-s, --encryption-key <encryption-key>      set [encryption-key] file path used for encryption (default: encryption-key)
	--token-code <code>                        set token code needed to authorize the app
	-h, --help                                 output usage information
```
### Download a file
After a successful backup the file can be downloaded using the provided name tag.
If there are multiple files with the same tag, always the latest (newest) file is downloaded.
```
gdrive-backup download testtag -c mycredentials.json -d testupload.txt
```
Help:
```
Usage: download [options] <name>

Download latest backup with given name tag.

Options:

	-d, --dest <file>                          set destination file
	-c, --credentials-path <credentials-path>  set [credentials-path] file path (default: credentials.json)
	-t, --token-path <token>                   set [token] file path (default: token.json)
	--token-code <code>                        set token code needed to authorize the app
	--no-input                                 set flag to not process user input (e.g. to input the authorization token in shell)
	-h, --help                                 output usage information
```

# Storing and retrieving backups with properties
When *backup* is called the file is identified with the provided *name* tag. This tag is set as the *backup_name* property for the uploaded and created backup file on Google Drive to allow finding it within a folder.

The counterpart *download* searches for the newest backup ordering by *addedTime desc* and checking the property *backup_name*. If a directory is provided also the directory id is included. The final search query therefore looks like this:

```javascript
properties has { key='backup_name' and value='name' } and 'folder_id' in parents
```


# Next Steps
* Backup into folder
* Make tutorial about backup (download latest file from specific folder)
	* Instruction steps for token verification
* Name files automatically
