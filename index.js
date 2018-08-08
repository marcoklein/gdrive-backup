#!/usr/bin/env node

// inspired by sample code on https://developers.google.com/drive/api/v3/quickstart/nodejs

// load required packages
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const {google} = require('googleapis');

const program = require('commander');


// If modifying these scopes, delete credentials.json.
const SCOPES = ['https://www.googleapis.com/auth/drive'];


program
  .description('Easily upload, download and list backups. Upcoming feature: backup within folders, encryption.');

program
  .command('authorize')
  .description('Authorize app to be used with specific Google Drive account.')
  .option('-c, --credentials-path <credentials-path>', 'set [credentials-path]', 'credentials.json')
  .option('-t, --token-path <token>', 'set [token] file path', 'token.json')
  .option('--token-code <code>', 'set token code needed to authorize the app')
  .option('--no-input', 'set flag to not process user input (e.g. to input the authorization token in shell)')
  .action(function (options) {
    executeCommand(function () {
      // authorization succeeded
      console.log('Authorization succeeded.');
      process.exit(0);
    }, options);
  });


// TODO insert custom help with *.on('help');
program
  .command('backup <path> <name> [directory]')
  .description('Coming soon! Backup a specific folder using compression and encryption.')
  .option('-c, --credentials-path <credentials-path>', 'set [credentials-path] file path', 'credentials.json')
  .option('-t, --token-path <token>', 'set [token] file path', 'token.json')
  .option('-s, --encryption-key <encryption-key>', 'set [encryption-key] file path used for encryption', 'encryption-key')
  .option('--token-code <code>', 'set token code needed to authorize the app')
  .action(function (path, name, directory, options) {
    options.path = path;
    options.name = name;
    options.directory = directory;
    if (directory) {
      console.error('Directories are not yet supported but are available soon. Feel free to contribute to this project by making a pull request.');
      process.exit(-1);
      return;
    }
    executeCommand(backup, options);
  });

// define command line options
/*program
  .command('upload <file> ')
  .option('-c, --credentials-path <credentials-path>', 'set [credentials-path] file path', 'credentials.json')
  .option('-t, --token-path <token>', 'set [token] file path', 'token.json')
  .option('--upload-type <type>', 'set upload [type]', 'resumable')
  .option('--token-code <code>', 'set token code needed to authorize the app')
  .option('--no-input', 'set flag to not process user input (e.g. to input the authorization token in shell)')
  .action(function (file, options) {
    // prepare options
    options.file = file;
    options.uploadType = options.uploadType || "resumable";
    executeCommand(uploadFile, options);
  });*/


program
  .command('download <name> [directory]')
  .description('Download latest backup with given name tag.')
  .option('-d, --dest <file>', 'set destination file')
  .option('-c, --credentials-path <credentials-path>', 'set [credentials-path] file path', 'credentials.json')
  .option('-t, --token-path <token>', 'set [token] file path', 'token.json')
  //.option('-l, --latest', 'download the latest available file')
  .option('--token-code <code>', 'set token code needed to authorize the app')
  .option('--no-input', 'set flag to not process user input (e.g. to input the authorization token in shell)')
  .action(function (name, directory, options) {
    // test for required options
    /*if (!options.dest) {
      console.error('No destination file specified (use --dest <file>)');
      return process.exit(-1);
    }*/

    options.name = name;
    options.directory = directory;

    if (directory) {
      console.error('Directories are not yet supported but are available soon. Feel free to contribute to this project by making a pull request.');
      process.exit(-1);
      return;
    }


    // prepare options
    options.credentialsPath = options.credentialsPath || "credentials.json";
    options.uploadType = options.uploadType || "resumable";
    executeCommand(download, options);
  });


/*program
  .command('list <name> [directory]')
  .description('List backups with given name in specific folder ordered by time (starting with newest backup).')
  .option('-c, --credentials-path <credentials-path>', 'set [credentials-path] file path', 'credentials.json')
  .option('-t, --token-path <token>', 'set [token] file path', 'token.json')
  .option('--token-code <code>', 'set token code needed to authorize the app')
  .action(function (options) {
    options.name = name;
    options.directory = directory;

    if (directory) {
      console.error('Directories are not yet supported but are available soon. Feel free to contribute to this project by making a pull request.');
      process.exit(-1);
      return;
    }

    // prepare options
    options.credentialsPath = options.credentialsPath || "credentials.json";
    executeCommand(listFiles, options);
  });*/


program.parse(process.argv);

if (!program.args.length) program.help();

/**
 * Executes the command using given options.
 */
function executeCommand(commandFunction, options) {
  // Load client secrets from a local file.
  fs.readFile(options.credentialsPath, (err, content) => {
    if (err) {
      console.log('Error loading client secret file. Set it using the -c command or save it under credentials.json in the same folder.', err);
      process.exit(-1);
    }
    // Authorize a client with credentials, then call the Google Drive API.
    authorize(JSON.parse(content), options, commandFunction);
  });
}

/**
Backup given folder by running gzip for compression and encryption.

0. create unique backup name
1. compress
2. encrypt
3. upload
*/
function backup(auth, options) {
  // if path is folder, compress it, if it's a file upload it
  var pathStats = fs.lstatSync(options.path);
  if (pathStats.isFile()) {
    // file
    uploadFile(auth, options.path, options.name, function (err, file) {
      if (err) {
        console.error(err);
        process.exit(-1);
        return;
      }
      console.log('Uploaded file with id:')
      console.log(file.id);
      process.exit(0);
    });
  } else if (pathStats.isDirectory()) {
    // directory
    console.error('Directory backup is not yet supported. Use other command line tools (like tar) to compress your backup folder.');
    process.exit(-1);

    // TODO add support for encryption
    // read secret key for encryption

    /*fs.readFile(path.resolve(__dirname, options.credentials), (err, key) => {
      if (err) {
        console.log('Error loading encryption key. Set it using the -k command or save it under encryption-key in the same folder.', err);
        process.exit(-1);
      }
      // key read
      // 1. compress

    });*/
    return;
  } else {
    console.error('Unsupported path type: only files or directories allowed.');
    process.exit(-1);
    return;
  }

}

function download(auth, options) {
  // retrieve file id
  listFiles(auth, options.name, options.directory, (err, files) => {
    if (err) {
      console.error(err);
      process.exit(-1);
      return;
    }
    if (files.length === 0) {
      // return empty set
      console.log('No backups stored with name "%s".', options.name);
      process.exit(3);
      return;
    }
    var file = files[0]; // newest backup
    options.dest = options.dest || file.name; // set destination if unset
    // download most recent backup
    downloadFile(auth, file.id, options.dest, (err, file) => {
      if (err) {
        console.error(err);
        process.exit(-1);
        return;
      }
      console.log('Successfully downloaded latest backup.');
      console.log('createdTime\ndestination');
      console.log(item.createdTime);
      console.log(options.dest);
      process.exit(0);
    })
  });
}

/**
 * Upload given file and attaching the backupName to properties metadata.
 */
function uploadFile(auth, file, backupName, callback) {
  const drive = google.drive({version: 'v3', auth});
  var fileName = path.basename(file);
  var fileMetadata = {
    'name': fileName,
    'description': 'Auto generated by gdrive-backup.',
    'properties': {
      // backup name to identify backup
      'backup_name': backupName
    }
  };
  var media = {
    // TODO set mime type to some archive type (mimeType: 'image/jpeg'),
    body: fs.createReadStream(file)
  };
  drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id'
  }, function (err, file) {
    if (err) {
      // Handle error
      callback(err, null);
    } else {
      callback(null, file.data);
    }
  });
}


function downloadFile(auth, fileId, destinationFile, callback) {
  const drive = google.drive({version: 'v3', auth});
  var dest = fs.createWriteStream(destinationFile);
  console.log('Downloading file with id: ' + fileId);

  drive.files.get({
      fileId: fileId,
      alt: 'media'
    },
    { responseType: 'stream' },
    (err, res) => {
      if (err) {
        callback(err, null);
        return;
      }
      //console.log(res.data);
      res.data
        .on('end', function() {
          console.log('Downloaded file.');
          callback(null, res);
        })
        .on('error', function (err) {
          callback(err, null);
        })
        .pipe(dest);
    }
  );
}

/**
 * Retrieve
 */
function listFiles(auth, backupName, directory, callback) {
  // create query for files
  var query = "properties has { key='backup_name' and value='" + backupName + "' }";
  // TODO if directories are supported: add following line
  //query += " and 'folder_id' in parents";

  const drive = google.drive({version: 'v3', auth});
  drive.files.list({
    q: query,
    // pageSize: 10,
    fields: 'nextPageToken, files(id, name, createdTime)',
    spaces: 'drive',
    orderBy: 'createdTime desc'

  }, (err, res) => {
    if (err) {
      callback(err, null);
      return;
    }
    const files = res.data.files;
    if (files.length) {
      console.log('Files:');
      files.map((file) => {
        console.log(`${file.name},${file.id},${file.createdTime}`);
      });
    } else {
      console.log('No files found.');
    }
    callback(null, files);
  });
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, options, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(options.tokenPath, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, options, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client, options);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, options, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  // let user input token code in shell
  let inputToken = function () {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) {
          console.error(err);

          console.log('#########################################################################');
          console.log('#########################################################################');
          console.log('################# Provided token invalid! ###############################');
          console.log('################ App authorization needed. ##############################');
          console.log('############### Visit the following website #############################');
          console.log('######### and provide code through --token-code <code>. #################');
          console.log('#########################################################################');
          console.log('#########################################################################');
          return process.exit(2);
        }
        oAuth2Client.setCredentials(token);
        // Store the token to disk for later program executions
        fs.writeFile(options.tokenPath, JSON.stringify(token), (err) => {
          if (err) {
            console.error(err);
            process.exit(-1);
          }
          console.log('Token stored to', options.tokenPath);
          callback(oAuth2Client, options);
        });
      });
    });
  }

  if (options.tokenCode) {
    console.log('Token code found, trying to authorize...');
    oAuth2Client.getToken(options.tokenCode, (err, token) => {
      if (err) {
        if (options.input) {
          console.log('#########################################################################');
          console.log('#########################################################################');
          console.log('################# Provided token invalid! ###############################');
          console.log('################ App authorization needed. ##############################');
          console.log('############### Visit the following website #############################');
          console.log('######### and input the token using the command line. ###################');
          console.log('#########################################################################');
          console.log('#########################################################################');
          console.log(authUrl);
          // await user input
          inputToken();
        } else {
          console.log('#########################################################################');
          console.log('#########################################################################');
          console.log('################# Provided token invalid! ###############################');
          console.log('################ App authorization needed. ##############################');
          console.log('############### Visit the following website #############################');
          console.log('######### and provide code through --token-code <code>. #################');
          console.log('#########################################################################');
          console.log('#########################################################################');
          console.log(authUrl);
          process.exit(2);
        }
        return;
      }
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(options.tokenPath, JSON.stringify(token), (err) => {
        if (err) {
          console.error(err);
          process.exit(-1);
        }
        console.log('Token stored to', options.tokenPath);
        callback(oAuth2Client, options);
      });
    });
  } else {
    if (options.input) {
      console.log('#########################################################################');
      console.log('#########################################################################');
      console.log('################ App authorization needed. ##############################');
      console.log('############### Visit the following website #############################');
      console.log('######### and input the code using the command line. ####################');
      console.log('#########################################################################');
      console.log('#########################################################################');
      console.log(authUrl);
      // await user input
      inputToken();
    } else {
      console.log('#########################################################################');
      console.log('#########################################################################');
      console.log('################ App authorization needed. ##############################');
      console.log('############### Visit the following website #############################');
      console.log('######### and provide code through --token-code <code>. #################');
      console.log('#########################################################################');
      console.log('#########################################################################');
      console.log(authUrl);
      process.exit(2);
    }
  }


}
