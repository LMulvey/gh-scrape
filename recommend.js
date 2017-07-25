// ## Include dotenv to keep our environment variables secret.
// ### .env is in .gitignore but always double-check this.
const env = require('dotenv').config();

// ## Error-handling for dotenv + verifying GitHub authentication details.
if(env.error != undefined && env.error.errno == -2) return console.log('Error: .env file not found. -> ' + env.error);
if(!process.env.GITHUB_TOKEN || !process.env.GITHUB_USER || !process.env.USER_AGENT_CONFIG){
     return console.log(
    'Error: Missing credentials. Check .env file.\n' + 
    'All .env files require:\n' + 
    'GITHUB_USER, GITHUB_TOKEN, and USER_AGENT_CONFIG to be defined.');
}
// ## Require two libraries--request and fs
const request = require('request'),
        fs = require('fs');

// ## Define constant variables.
const scrapeUser = process.argv[2],
    scrapeRepo = process.argv[3],
    USER_AGENT = { 'User-Agent': process.env.USER_AGENT_CONFIG },
    API_ROOT = "@api.github.com";

// ## Log an intro to the user so they know that the application is running.
// ### -> Give the user the instructions they need if they didn't enter any args.
// ### -> Do not assign default args anymore. Instead, print out instructions and end.
console.log("####################################\n" + 
            "GH RECOMMEND - GitHub Repo Recommend\n" +
            "####################################\n" +
            "Recommend five repos based on one you submit!!\n" +
            "####################################"
);
if(!scrapeUser || !scrapeRepo) { return console.log(
    "#################################################################################################\n" +
    "This script can be used to recommend five repos based on one you submit.\n" + 
    "To use, run script with two args: <GitHub Username> <GitHub Repo (belonging to user)>\n" + 
    "If you're using Node, simply type: node recommend.js <username> <repo> and you're all set.\n" +
    "Good luck! -- lm\n" +
    "#################################################################################################"
); } else { console.log('Grabbing your recommendations based off of REPO: ' + scrapeRepo + ' by ' + scrapeUser); }

// ## Call getRepoRecommendations with provided args (assigned to vars at top).
// ### -> forEach key:val pair returned in scrape, run downloadImageByURL
getRepoRecommendations(scrapeUser, scrapeRepo, (err, scrape) => { 
    if(err) return console.log('Error occurred!\nError: ' + err.error + ' - ' + err.message);
    
    scrape.forEach((item) => {
        console.log("[" + item['stars'] + "] " + item['full_name']);
    })
});

// ## Let's define our functions.
function getRepoRecommendations(repoOwner, repoName, cb) {
// ## getRepoContributors takes a repoOwner and repoName as arguments.
// ### -> Constructs a request_url to grab avatars from based on the supplied
// ###    username (repoOwner) and repo (repoName).
// ### -> Requests the JSON data from api.github.com.
// ###    If err, kill. If succeed, callback with parsed JSON data.

    const request_url = "https://" + process.env.GITHUB_USER + ":" + process.env.GITHUB_TOKEN + API_ROOT
    + '/repos/' + repoOwner + "/" + repoName + "/contributors";

    request.get({ url: request_url, headers: USER_AGENT },
        (err, res, body) => {
            if(err) cb({ error: 'invalid_url', message: 'Unable to request from API URL.'});
            else getContributorStarredURLs(JSON.parse(body), (err, stack) => {
              if(err) cb({ error: 'starred_stack_crash', message: 'Error grabbing Stargazers stack.'});
              else cb(null, stack);  
        });
    });
}

function getContributorStarredURLs(contributors, cb) {  
    let starredStack = [];
    let processed = 0;
    console.log('getting star URLs');
    contributors.forEach((contributor) => {
       
        console.log('in the for each - ' + contributor['login']);
        request.get( {
             url: "https://" + process.env.GITHUB_USER + ":" + process.env.GITHUB_TOKEN + API_ROOT
             + '/users/' + contributor['login'] + "/starred", headers: USER_AGENT },
            (err, res, body) => {
                if(err) cb({ error: 'invalid_starred_url', message: 'Unable to request from Starred URL.'});
                else { 
                    let info = JSON.parse(body);
                    console.log(info['full_name']);
                    starredStack.push( { "stars" : info['stargazers_count'], "full_name" : info['full_name'] });
                }
        });
        processed++;

        if(processed === contributors.length) {
            console.log('finished starred stack.');
            console.log(starredStack);
            cb(null, starredStack);
        }
    });
}
