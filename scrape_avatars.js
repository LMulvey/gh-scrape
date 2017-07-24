const request = require('request'),
        fs = require('fs');

// * Define constants //
const GITHUB_USER = "LMulvey";
const GITHUB_TOKEN = "58feac3c8a547b9cc4d423805605e1c87804ddb8";
const USER_AGENT = { 'User-Agent': 'LMulvey' }
console.log('Welcome to GH Scrape.\n -> Let\'s scrape some avatars!');

function getRepoContributors(repoOwner, repoName, cb) {
    let request_url = "https://"
     + GITHUB_USER + ":" + GITHUB_TOKEN + 
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
    request.get({ url: url, headers: USER_AGENT })
    .on('err', (err) => {
        return err;
    })
    .on('response', (response) => {
        console.log('Downloading file...\n');
        console.log('Received repsonse code: ' + response.statusCode);
    })
    .pipe(fs.createWriteStream(filePath));
}

getRepoContributors("jquery", "jquery", (err, res, body) => {
    console.log("Errors: " + err +
    "\nResult: ");
    for (var key in body) {
        downloadImageByURL(body[key]['avatar_url'], './avatars/' 
        + body[key]['login'] + '.jpg');
    };
});

