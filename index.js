#!/usr/bin/env node

// load required packages
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

const program = require('commander');


// If modifying these scopes, delete credentials.json.
const SCOPES = ['https://www.googleapis.com/auth/drive'];
const TOKEN_PATH = 'token.json';


// define command line options
program
  .command('upload <file>')
  .option('-c, --credentials <credentials.json>', 'set credentials file path. defaults to "credentials.json"')
  .option('-t, --upload-type <type>', 'set upload type. defaults to "resumable"')
  .action(function (upload, options) {
    // prepare options
    options.file = upload;
    options.credentials = options.credentials || "credentials.json";
    options.uploadType = options.uploadType || "resumable";
    executeCommand(uploadFile, options);
  });


program
  .command('download <file>');

program
  .command('list')
  .option('-c, --credentials <credentials.json>', 'set credentials file path. defaults to "credentials.json"')
  .action(function (options) {
    // prepare options
    options.credentials = options.credentials || "credentials.json";
    executeCommand(listFiles, options);
  });


program.parse(process.argv);



/**
 * Executes the command using given options.
 */
function executeCommand(commandFunction, options) {
  // Load client secrets from a local file.
  fs.readFile(options.credentials, (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
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
    } else {
      console.log('File Id: ', file.id);
    }
  });
}

/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listFiles(auth, options) {
  const drive = google.drive({version: 'v3', auth});
  drive.files.list({
    pageSize: 10,
    fields: 'nextPageToken, files(id, name)',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const files = res.data.files;
    if (files.length) {
      console.log('Files:');
      files.map((file) => {
        console.log(`${file.name} (${file.id})`);
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
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return callback(err, options);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client, options);
    });
  });
}
