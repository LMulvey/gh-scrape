// ## Include dotenv to keep our environment variables secret.
// ### .env is in .gitignore but always double-check this.
require('dotenv').config();

const request = require('request'),
        fs = require('fs');

// ## Define constant variables.
const scrapeUser = (!process.argv[2]) ? "LMulvey" : process.argv[2],
    scrapeRepo = (!process.argv[3]) ? "frotos" : process.argv[3],
    USER_AGENT={ 'User-Agent': process.env.USER_AGENT_CONFIG }

// ## Log an intro to the user so they know that the application is running.
console.log('Welcome to GH Scrape.\n -> Let\'s scrape some avatars!');

function getRepoContributors(repoOwner, repoName, cb) {
// ## getRepoContributors takes a repoOwner and repoName as arguments.
// ### -> Constructs a request_url to grab avatars from based on the supplied
// ###    username (repoOwner) and repo (repoName).
// ### -> Requests the JSON data from api.github.com.
// ###    If err, kill. If succeed, callback with parsed JSON data.

    const request_url = "https://"
     + process.env.GITHUB_USER + ":" + process.env.GITHUB_TOKEN + 
    "@api.github.com/repos/" 
    + repoOwner + "/" + repoName + 
    "/contributors";

    request.get({ url: request_url, headers: USER_AGENT },
     (err, res, body) => {
        if(err) cb(err);
        else cb(null, res, JSON.parse(body));
    });
}

function downloadImageByURL(url, filePath) {
// ## downloadImageByURL takes a URL and a local filepath as arguments.
// ### -> Requests JSON data from URL passed in arguments.
// ### -> Upon success, start fs writeStream to write file to filePath.
// ### -> .on 'end', write to console. * Note: 'end' is normally covered by .pipe()
// ###    However, since I wanted a special action during the 'end' action, it can
// ###    be added in this fashion. 

    request.get({ url: url, headers: USER_AGENT })
    .on('err', (err) => {
        return err;
    })
    .on('response', (response) => {
        console.log('Downloading file ' + url + ' to path: ' + filePath);
        console.log('Received repsonse code: ' + response.statusCode);
    })
    .on('end',  () => { 
        console.log('Download completed.');
    })
    .pipe(fs.createWriteStream(filePath));
   
}

// ## Call getRepoContributors with provided args (assigned to vars at top).
// ### -> For each key:val pair returned, run downloadImageByURL
getRepoContributors(scrapeUser, scrapeRepo, (err, res, body) => { 
    console.log("Errors: " + err +
    "\nResult: ");
    console.log('*********** STARTING DOWNLOAD OF ' + body.length + ' FILES... *************');
    for (let key in body) {
        downloadImageByURL(body[key]['avatar_url'], './avatars/' 
        + body[key]['login'] + '.jpg');
    };
});

