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

let i = 0; 


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
    let stars = sortByKey(scrape);
    for(i = 0; i < 5; i++) console.log("#" + (i+1) + " [ " + stars[i] + " stars ] " + scrape[stars[i]]);
});

// ## Let's define our functions.
function getRepoRecommendations(repoOwner, repoName, cb) {
// ## getRepoRecommendations takes a repoOwner and repoName as arguments.
    const request_url = "https://" + process.env.GITHUB_USER + ":" + process.env.GITHUB_TOKEN + API_ROOT
    + '/repos/' + repoOwner + "/" + repoName + "/contributors";

    request.get({ url: request_url, headers: USER_AGENT },
        (err, res, body) => {
            if(err) cb({ error: 'invalid_url', message: 'Unable to request from API URL.'});
            if(body.length <= 1) cb({ error: 'too_few_contributors', 
                                      message: 'Sorry! Repo must have more than one contributors.'})
            else getContributorStarredURLs(JSON.parse(body), (err, stack) => {
              if(err) cb({ error: err.error, message: err.message});
              else cb(null, stack);  
        });
    });
}

function getContributorStarredURLs(contributors, cb) { 
    let processed = 0;
    let starredStack = {};
    contributors.forEach((contributor) => {
        request.get( {
             url: "https://" + process.env.GITHUB_USER + ":" + process.env.GITHUB_TOKEN + API_ROOT
             + '/users/' + contributor['login'] + "/starred", headers: USER_AGENT },
            (err, res, body) => {
                if(err) cb({ error: 'invalid_starred_url', message: 'Unable to request from Starred URL.'});
                else if(body.length < 5) cb({ error: 'too_few_starred_repos', 
                                      message: 'Sorry! There are too few starred repos to analyze!'})
                else { 
                    let pull = JSON.parse(body);
                    pull.forEach((info) => {
                        let key_name =  info['stargazers_count'];
                        starredStack[key_name] = info['full_name'];
                    });
                }
            processed++;
            if(processed === contributors.length-1) {
                cb(null, starredStack);
            }
        });
    });
}

function sortByKey(obj) {
    let keys = Object.keys(obj);
    return keys.sort((a,b) => { return b-a; }); // Returns a descending list
}