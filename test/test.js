const expect = require('chai').expect;
const fs = require('fs');
var Instagram = require('../instagramDownloader.js');

describe('Instagram', function() {
	this.timeout(1000000);
	const instagramProfile = 'undefined';
	const downloadDirectory = `./downloads/${instagramProfile}`;

  before(async function() {
    Instagram = new Instagram();
    await Instagram.init(instagramProfile);
  });

  describe('Navigation', function() {

		it('logs into Instagram', async function() {
			let isLoggedIn = await Instagram.logIn();
			expect(isLoggedIn).to.equal(true);
		})

		it('goes to profile', async function() {
			let isOnProfile = await Instagram.gotoProfile();
			expect(isOnProfile).to.equal(true);
		})
  
  })


	describe("Getting content", function() {

		it('gets links to all media content', async function() {
			let filesToDownload = await Instagram.collectLinksToMediaForDownload();
			expect(filesToDownload).to.not.be.empty;
		})

		it('downloads all media content', async function() {
			let filesToDownload = [
		  'https://scontent-vie1-1.cdninstagram.com/t51.2885-15/e35/16464615_1595194743831065_8736962798694694912_n.jpg',
		  'https://scontent-vie1-1.cdninstagram.com/t51.2885-15/e35/16230555_1828477217420366_6573036997978357760_n.jpg',
		  'https://scontent-vie1-1.cdninstagram.com/t50.2886-16/12478559_1112062178805344_794675125_n.mp4'
			];

			await Instagram.downloadMediaContent(filesToDownload);
			fs.readdir(downloadDirectory, (err, files) => {
			  expect(filesToDownload.length).to.equal(files.length);
			});
		});
	
	})

  after(async function() {
    // runs after all tests in this block
    await Instagram.end();
  });

})