// ## Include dotenv to keep our environment variables secret.
// ### .env is in .gitignore but always double-check this.
const env = require('dotenv').config();

// ## Error-handling for dotenv + verifying GitHub authentication details.
if(env.error != undefined && env.error.errno == -2) return console.log('Error: .env file not found. -> ' + env.error);
if(!process.env.GITHUB_TOKEN || !process.env.GITHUB_USER) return console.log('Error: Missing credentials. Check .env file.');

// ## Require two libraries--request and fs
const request = require('request'),
        fs = require('fs');

// ## Define constant variables.
const scrapeUser = process.argv[2],
    scrapeRepo = process.argv[3],
    USER_AGENT = { 'User-Agent': process.env.USER_AGENT_CONFIG },
    API_ROOT = "@api.github.com/repos/";

// ## Log an intro to the user so they know that the application is running.
// ### -> Give the user the instructions they need if they didn't enter any args.
// ### -> Do not assign default args anymore. Instead, print out instructions and end.
console.log("####################################\n" + 
            "GH SCRAPE - GitHub Avatar Scrape\n" +
            "####################################\n" +
            "Download Contributor Avatars from Any Repo!\n" +
            "####################################"
);
if(!scrapeUser || !scrapeRepo) { return console.log(
    "#################################################################################################\n" +
    "This script can be used to scrape and download avatars of all contributors from any GitHub repo.\n" + 
    "To use, run script with two args: <GitHub Username> <GitHub Repo (belonging to user)>\n" + 
    "If you're using Node, simply type: node scrape_avatars <username> <repo> and you're all set.\n" +
    "Good luck! -- lm\n" +
    "#################################################################################################"
); } else { console.log('Scraping Avatars from REPO: ' + scrapeRepo + ' by ' + scrapeUser); }

// ## Call getRepoContributors with provided args (assigned to vars at top).
// ### -> forEach key:val pair returned in scrape, run downloadImageByURL
getRepoContributors(scrapeUser, scrapeRepo, (err, res, scrape) => { 
    if(err) return console.log('Error occurred!\nError: ' + err.error + ' - ' + err.message);
    console.log('*********** STARTING DOWNLOAD OF ' + scrape.length + ' FILES... *************');
    
    scrape.forEach((item) => {
        downloadImageByURL(item['avatar_url'], './avatars/' + item['login'] + '.jpg', (err) => {
           if(err) return console.log('Error occurred!\nError: ' + err.error + ' - ' + err.message);
        });
    });  
});

// ## Let's define our functions.
function getRepoContributors(repoOwner, repoName, cb) {
// ## getRepoContributors takes a repoOwner and repoName as arguments.
// ### -> Constructs a request_url to grab avatars from based on the supplied
// ###    username (repoOwner) and repo (repoName).
// ### -> Requests the JSON data from api.github.com.
// ###    If err, kill. If succeed, callback with parsed JSON data.

    const request_url = "https://" + process.env.GITHUB_USER + ":" + process.env.GITHUB_TOKEN + API_ROOT
    + repoOwner + "/" + repoName + "/contributors";

    request.get({ url: request_url, headers: USER_AGENT },
     (err, res, body) => {
        if(err) cb({ error: 'invalid_url', message: 'Unable to request from API URL.'});
        else cb(null, res, JSON.parse(body));
    });
}

function downloadImageByURL(url, filePath, cb) {
// ## downloadImageByURL takes a URL and a local filepath as arguments.
// ### -> Requests JSON data from URL passed in arguments.
// ### -> Upon success, start fs writeStream to write file to filePath.
// ### -> .on 'end', write to console. * Note: 'end' is normally covered by .pipe()
// ###    However, since I wanted a special action during the 'end' action, it can
// ###    be added in this fashion. 

    request.get({ url: url, headers: USER_AGENT })
    .on('err', (err) => {
        cb({ error: 'invalid_avatar_url', message: 'Unable to download avatar from URL. Possible API issue.'});
    })
    .on('response', (response) => {
        console.log('Downloading file ' + url + ' to path: ' + filePath);
        console.log('Received repsonse code: ' + response.statusCode);
    })
    .on('end',  () => { 
        console.log('Download completed.');
    })
    .pipe(fs.createWriteStream(filePath), (err) => {
        if(err) cb({ error: 'invalid_local_filepath', message: 'File Path does not exist.'});
    }); 
}