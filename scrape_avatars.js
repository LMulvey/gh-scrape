const request = require('request'),
        fs = require('fs');

// * Define constants //
const GITHUB_USER = "LMulvey",
    GITHUB_TOKEN = "58feac3c8a547b9cc4d423805605e1c87804ddb8",
    USER_AGENT = { 'User-Agent': 'LMulvey' },
    scrapeUser = (!process.argv[2]) ? "LMulvey" : process.argv[2],
    scrapeRepo = (!process.argv[3]) ? "frotos" : process.argv[3];

//Intro
console.log('Welcome to GH Scrape.\n -> Let\'s scrape some avatars!');

function getRepoContributors(repoOwner, repoName, cb) {
    const request_url = "https://"
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
        console.log('Downloading file ' + url + ' to path: ' + filePath);
        console.log('Received repsonse code: ' + response.statusCode);
    })
    .on('end',  () => { 
        console.log('Download completed.');
    })
    .pipe(fs.createWriteStream(filePath));
   
}

getRepoContributors(scrapeUser, scrapeRepo, (err, res, body) => { 
    console.log("Errors: " + err +
    "\nResult: ");
    console.log('*********** STARTING DOWNLOAD OF ' + body.length + ' FILES... *************');
    for (let key in body) {
        downloadImageByURL(body[key]['avatar_url'], './avatars/' 
        + body[key]['login'] + '.jpg');
    };
    console.log('*********** DOWNLOADED ' + body.length + ' FILES... *************');
    console.log('*********** CHECK ./AVATARS/ FOLDER FOR RESULTS *************');
});

