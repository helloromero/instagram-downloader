const puppeteer = require('puppeteer');
const fs = require('fs');
const async = require('async');
const request = require('request');
const ProgressBar = require('progress');
const Account = require('./accountDetails.json');

function InstagramDownloader() {

  var browser,
      instagramProfile,
      page;

  var _this = this;
  var filesToDownload = [];

  this.init = async function(profile) {
    browser = await puppeteer.launch({headless: true});
    page = await browser.newPage();
    instagramProfile = profile;
    page.setViewport({width: 1200, height: 900});
    _this._monitorAndCollectVideoLinks();
  }

  this._navigateToHomePageAndSubmitLoginDetails = async function() {
    await page.goto('https://instagram.com');

    await page.waitFor('._msxj2'); // AJAX login link

    await page.click('._msxj2'); // Go to login page

    // Enter login details
    await page.type('input[name="username"]', Account.username);
    await page.type('input[name="password"]', Account.password);


    await page.click('._qv64e._gexxb._4tgw8._njrw0'); // Click on Login button

    await page.waitForNavigation({waitUntil: 'networkidle'});
  }

  this._isLoggedIn = async function() {
    // Check if login failed message is present on page
    let isLoggedIn = await page.$('#slfErrorAlert');
    isLoggedIn = isLoggedIn !== null;
    return isLoggedIn;
  }

  this.logIn = async function() {
    await _this._navigateToHomePageAndSubmitLoginDetails();
    let isLoginSuccessful = await _this._isLoggedIn();
    return isLoginSuccessful;
  }

  this._isOnProfile = async function() {
    let isOnProfile = await page.$$('._mesn5');
    isOnProfile = isOnProfile.length > 0
    return isOnProfile;
  }

  this.gotoProfile = async function() {
    await page.goto(`https://www.instagram.com/${instagramProfile}/`, {waitUntil: 'load'});

    let isOnProfilePage = await _this._isOnProfile();
    return isOnProfilePage;
  }

  this._getNumberOfPosts = async function(url) {
    let numberOfPosts = await page.evaluate(() => {
      return document.querySelector('._fd86t').innerHTML; // e.g., 1,766
    })
    return parseInt(numberOfPosts.replace(/,/g, "")); // remove commas from string and change its type to Int
  }

  // Check if user posted multiple media content in one post
  this._isMoreMediaAvailableWithinPost = async function() {
    let isMoreMediaOnSamePost = await page.evaluate(() => {
      if (document.getElementsByClassName('coreSpriteRightChevron').length > 0) {
        return true;
      }
      return false;
    });

    return isMoreMediaOnSamePost;
  }

  this._isPostContentVideo = async function() {
    let isPostContentVideo = await page.evaluate(() => {
      if (document.getElementsByClassName('videoSpritePlayButton').length > 0) {
        return true;
      }
      return false;
    });

    return isPostContentVideo;
  }

  this._getPhotoLink = async function() {
    let photoLink = await page.evaluate(() => {
      if (document.querySelector('._e3il2._gxii9') !== null) { // Get link to image if IG post is not tagged
        return document.querySelector('._e3il2._gxii9').childNodes[0].childNodes[0].src;
      } else if (document.querySelector('._e3il2._pmuf1') !== null) { // Get link to image if IG post tagged
        return document.querySelector('._e3il2._pmuf1').childNodes[0].childNodes[0].src
      }
      return false;
    })

    return photoLink;
  }

  this._isNextPostOnPage = async function() {
    // Check if there is a next post on IG page by looking for next arrow
    let isNextPostOnPage = await page.evaluate(() => {
      if (document.getElementsByClassName('coreSpriteRightPaginationArrow').length > 0) {
        return true;
      }
      return false;
    })

    return isNextPostOnPage;
  }

  this._goToNextPost = async function() {
    await page.click('.coreSpriteRightPaginationArrow');
    await page.waitForNavigation({waitUntil: 'networkidle'}); // Wait for page to load
  }

  this._goToNextMediaWithinPost = async function() {
    await page.click('.coreSpriteRightChevron');
    await page.waitForNavigation({waitUntil: 'networkidle'}); // Wait for page to load
  }

  // To get source link for video
  this._playVideo = async function() {
    await page.click('.videoSpritePlayButton');
  }

  this._clickOnFirstPost = async function() {
    await page.click('._e3il2');
    await page.waitForNavigation({waitUntil: 'networkidle'}); // Wait for page to load
  }

  this._monitorAndCollectVideoLinks = function() {
    page.on('response', response => {
      if (response.url.includes('cdninstagram')) {

        // Catch video URLs
        if (response.url.endsWith('.mp4') === true) {
          filesToDownload.push(response.url);
        }

      }
    })
  }

  // Gets direct link to photo/video
  this._getLinkToMediaSourceInPost = async function() {
    let isPostContentVideo = await _this._isPostContentVideo();
    if (isPostContentVideo) {
      await _this._playVideo();
    } else {
      let photoLink = await _this._getPhotoLink();
      if (photoLink) {
        filesToDownload.push(photoLink);
      }
    }
  }

  /*
  * Navigate through each post on IG profile and collect links of every photo/video
  * Video links get collected by setting up an event listener through _monitorAndCollectVideoLinks
  * Photo links get collected by colleting source link from the DOM
  */
  this.collectLinksToMediaForDownload = async function() {
    let numberOfPosts = await _this._getNumberOfPosts();
    var postsToGetBar = _this.createProgressBar('  collecting links [:bar] :percent', numberOfPosts);

    await _this._clickOnFirstPost();
    // Go through all IG media, clicking on the right arrow
    var isMoreMediaOnPage = true;
    while (isMoreMediaOnPage) {

      // If there are multiple photos/videos in the same post, gather those
      var isMoreMediaInPost = true;
      while (isMoreMediaInPost) {

        isMoreMediaInPost = await _this._isMoreMediaAvailableWithinPost();
        await _this._getLinkToMediaSourceInPost();

        if (isMoreMediaInPost) {
          await _this._goToNextMediaWithinPost();
        }
        postsToGetBar.tick(); // Increase progress bar
      }

      // Check if there is a next post on IG page by looking for next arrow
      isMoreMediaOnPage = await _this._isNextPostOnPage();

      if (isMoreMediaOnPage) {
        await _this._goToNextPost();
      } else {
        await _this._getLinkToMediaSourceInPost();
      }

    }

    return filesToDownload;
  }

  this.setDirectoryForDownload = function() {
    // Create directory
    if (!fs.existsSync(`./downloads`)) {
      fs.mkdirSync(`./downloads`);
    }
    if (!fs.existsSync(`./downloads/${instagramProfile}`)) {
        fs.mkdirSync(`./downloads/${instagramProfile}`);
    }
  }

  this.createProgressBar = function(text, progressBarSize) {
    let progressBar = new ProgressBar(text, {
      complete: '=',
      incomplete: ' ',
      width: 20,
      total: progressBarSize
    });
    return progressBar;
  }

  /*
  * Sets up a progress bar and starts downloading a collection of files
  * @param filesToDownload is an array of links
  */
  this.downloadMediaContent = function(filesToDownload) {
    return new Promise(resolve => {

      _this.setDirectoryForDownload()

      var fileDownloadsBar = _this.createProgressBar('  downloading [:bar] :percent', filesToDownload.length);

      async.eachSeries(filesToDownload, (url, callback) => {
        let filename = url.split('/');
        filename = filename[filename.length - 1];

        // Skip file download if it exists already
        fs.access(`./downloads/${instagramProfile}/${filename}`, (err) => {

          fileDownloadsBar.tick();
          if (err) {
            _this.downloadFile(url, instagramProfile, filename)
            .then((res) => {
              callback();
            });
          } else {
            callback();
          }

        })


      }, () => {
        resolve(true);
      });

    })
  }

  // waits 1 second on first error, then 2, then 4, then 8, etc.
  // quits after request is successful or it gets to number of retries set
  this.downloadFile = function(url, directory, filename, lastTimeout = 500, retries = 5) {
    return new Promise(resolve => {
      let file = fs.createWriteStream(`./downloads/${instagramProfile}/${filename}`);
      if (retries > 0) {
        request
        .get(url)
        .on('error', function(err) {
          lastTimeout *= 2;
          retries--;
          file.destroy();
          fs.unlink(`./downloads/${instagramProfile}/${filename}`, (err) => {
            resolve(setTimeout(_this.downloadFile, lastTimeout, url, directory, filename, lastTimeout, retries));
          });
        })
        .pipe(file)
        .on('finish', function() { resolve(true); } ); // File saved. Go get the next one.
      } else {
        console.log(`Could not download: ${url}`);
        resolve(false);
      }
    })
  }

  this.run = async function() {
    let userLoggedIn = await _this.logIn();
    await _this.gotoProfile();
    let filesToDownload = await _this.collectLinksToMediaForDownload();
    await _this.downloadMediaContent(filesToDownload);
  }

  this.end = async function() {
    await browser.close();
    process.exit();
  }

}

module.exports = InstagramDownloader;
