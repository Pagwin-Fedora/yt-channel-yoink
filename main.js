const fs = require("fs/promises");
const readline = require("readline");
const {google} = require("googleapis");
let OAuth2 = google.auth.OAuth2;

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/youtube-nodejs-quickstart.json
let SCOPES = ['https://www.googleapis.com/auth/youtube.readonly'];
let TOKEN_DIR = /*(process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE)+ "/" +*/ '.credentials/';
let TOKEN_PATH = TOKEN_DIR + 'youtube-nodejs-quickstart.json';

// Load client secrets from a local file.
fs.readFile('client_secret.json').then(async function processClientSecrets(content) {
    //technically the promise google api thing returns isn't a promise which is a pain in the ass
    let authority = await authorize(JSON.parse(content))
    getSubscriptions(authority,null)
	.then(handlePage.bind(null,authority));
});


function handlePage(authority,response){
    let items = response.data.items;
    for(let item of items){
	console.log(item.snippet.title+" ".repeat(60-item.snippet.title.length)+item.snippet.resourceId.channelId);
    }
    if(response.data.nextPageToken){
        getSubscriptions(authority, response.data.nextPageToken)
            .then(handlePage.bind(null,authority))
    }
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
async function authorize(credentials) {
    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];

    var oauth2Client = new OAuth2({
	clientId, clientSecret, redirectUrl
    });
    // Check if we have previously stored a token.
    try {
	return await fs.readFile(TOKEN_PATH)
	    .then(async function(token) {
		oauth2Client.credentials = JSON.parse(token);
		return oauth2Client;
	    })
	    .catch(async function(e){
		console.log("getting token")
		return await getNewToken(oauth2Client);
	    });
    }
    catch(e){
	console.log(e);
    }
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
async function getNewToken(oauth2Client) {
    var authUrl = oauth2Client.generateAuthUrl({
	access_type: 'offline',
	scope: SCOPES
    });
    console.log('Authorize this app by visiting this url: ', authUrl);
    var rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
    });
    return await new Promise((res,err)=>{
	rl.question('Enter the code from that page here: ', function(code) {
	    rl.close();
	    oauth2Client.getToken(code, async function(err, token) {
	      if (err) {
		console.log('Error while trying to retrieve access token', err);
		return;
	      }
		oauth2Client.credentials = token;
		await storeToken(token);
		res(oauth2Client);
	    });
	});
    });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
async function storeToken(token) {
  try {
    await fs.mkdir(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token)).catch((err) => {
    if (err) throw err;
    console.log('Token stored to ' + TOKEN_PATH);
  });
}

/**
 * Lists the names and IDs of up to 10 files.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function getSubscriptions(auth, page) {
    var service = google.youtube("v3");
    return service.subscriptions.list({
	mine:true,
	auth,
	maxResults:50,
	part:"snippet",
	pageToken: page ? page:""
    });
}
