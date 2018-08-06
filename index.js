#!/usr/bin/env node

// inspired by sample code on https://developers.google.com/drive/api/v3/quickstart/nodejs

// load required packages
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

const program = require('commander');


// If modifying these scopes, delete credentials.json.
const SCOPES = ['https://www.googleapis.com/auth/drive'];
const TOKEN_PATH = './token.json';


program
  .description('Easily upload, download and list your backups. Upcoming feature: backup within folders.');

program
  .command('authorize')
  .description('Authorize app to be used with specific Google Drive.')
  .option('-c, --credentials <credentials>', 'set [credentials] file path', 'credentials.json')
  .option('--token-code <code>', 'set token code needed to authorize the app')
  .option('--no-input', 'set flag to not process user input (e.g. to input the authorization token in shell)')
  .action(function (options) {
    executeCommand(function () {
      // authorization succeeded
      console.log('Authorization succeeded.');
      process.exit(0);
    }, options);
  });

// define command line options
program
  .command('upload <file>')
  .option('-c, --credentials <credentials>', 'set [credentials] file path', 'credentials.json')
  .option('-t, --upload-type <type>', 'set upload [type]', 'resumable')
  .option('--token-code <code>', 'set token code needed to authorize the app')
  .option('--no-input', 'set flag to not process user input (e.g. to input the authorization token in shell)')
  .action(function (file, options) {
    // prepare options
    options.file = file;
    options.uploadType = options.uploadType || "resumable";
    executeCommand(uploadFile, options);
  });


program
  .command('download [id]')
  .option('-d, --dest <file>', 'set destination file (required)')
  .option('-c, --credentials <credentials>', 'set [credentials] file path', 'credentials.json')
  .option('-l, --latest', 'download the latest available file')
  .option('--token-code <code>', 'set token code needed to authorize the app')
  .option('--no-input', 'set flag to not process user input (e.g. to input the authorization token in shell)')
  .action(function (fileId, options) {
    // test for required options
    if (!options.dest) {
      console.error('No destination file specified (use --dest <file>)');
      return process.exit(1);
    }
    // prepare options
    options.fileId = fileId;
    options.credentials = options.credentials || "credentials.json";
    options.uploadType = options.uploadType || "resumable";
    executeCommand(downloadFile, options);
  });


program
  .command('list')
  .option('-o, --order-by <orderBy>', 'set order of files. defaults to "modifiedTime"')
  .option('-c, --credentials <credentials.json>', 'set credentials file path. defaults to "credentials.json"')
  .option('--token-code <code>', 'set token code needed to authorize the app')
  .action(function (options) {
    // prepare options
    options.orderBy = options.orderBy || "modifiedTime";
    options.credentials = options.credentials || "credentials.json";
    executeCommand(listFiles, options);
  });


program.parse(process.argv);

if (!program.args.length) program.help();

/**
 * Executes the command using given options.
 */
function executeCommand(commandFunction, options) {
  // Load client secrets from a local file.
  fs.readFile(options.credentials, (err, content) => {
    if (err) {
      console.log('Error loading client secret file. Set it using the -c command or save it under credentials.json in same folder.', err);
      process.exit(1);
    }
    // Authorize a client with credentials, then call the Google Drive API.
    authorize(JSON.parse(content), options, commandFunction);
  });
}


function uploadFile(auth, options) {
  const drive = google.drive({version: 'v3', auth});
  var fileName = options.file.split('/');
  fileName = fileName[fileName.length - 1];
  var fileMetadata = {
    'name': options.file
  };
  var media = {
    // TODO set mime type (mimeType: 'image/jpeg'),
    body: fs.createReadStream(options.file)
  };
  drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id'
  }, function (err, file) {
    if (err) {
      // Handle error
      console.error(err);
      process.exit(1);
    } else {
      console.log('Uploaded file with id:')
      console.log(file.data.id);
    }
  });
}


function downloadFile(auth, options) {
  const drive = google.drive({version: 'v3', auth});
  var fileId = options.fileId;
  var dest = fs.createWriteStream(options.dest);
  console.log('Downloading file with id: ' + fileId);

  drive.files.get({
      fileId: fileId,
      alt: 'media'
    },
    { responseType: 'stream' },
    (err, res) => {
      if (err) return console.log('The API returned an error: ' + err);
      //console.log(res.data);
      res.data
        .on('end', function() {
          console.log('Downloaded file.');
        })
        .on('error', function (err) {
          console.error(err);
          process.exit(1);
        })
        .pipe(dest);
    }
  );
}

/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listFiles(auth, options) {
  const drive = google.drive({version: 'v3', auth});
  drive.files.list({
    pageSize: 10,
    fields: 'nextPageToken, files(id, name, modifiedTime)',

  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const files = res.data.files;
    if (files.length) {
      console.log('Files:');
      files.map((file) => {
        console.log(`${file.name},${file.id},${file.modifiedTime}`);
      });
    } else {
      console.log('No files found.');
    }
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
  fs.readFile(TOKEN_PATH, (err, token) => {
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
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) {
            console.error(err);
            process.exit(1);
          }
          console.log('Token stored to', TOKEN_PATH);
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
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) {
          console.error(err);
          process.exit(1);
        }
        console.log('Token stored to', TOKEN_PATH);
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
