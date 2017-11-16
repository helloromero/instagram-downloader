const InstagramDownloader = require('./InstagramDownloader.js');

const instagramProfileName = process.argv.slice(2)[0]; // Get IG name from first command line argument

(async() => {

  if (instagramProfileName) {
    let instagram = new InstagramDownloader();
    await instagram.init(instagramProfileName);
    await instagram.run();
    await instagram.end();
  }
  
})()

