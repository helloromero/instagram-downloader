# Instagram Downloader

A command-line tool with which you can download both videos and photos from an Instagram account. It supports authentication so you can download content from Instagram accounts that are private but you yourself follow.

## Installation and Configuration

`git clone https://github.com/fluid10/instagram-downloader.git`

`cd instagram-downloader`

`npm install`

Open *accountDetails.json* and place in specified fields your Instagram username and password.

## Running the Application

After configuring the application following the steps above,
get content from an Instagram account by typing the following on the command line:

`npm run instagram-downloader` *instagram-account-to-get-content-from*

Content gets saved into ./downloads/*instagram-account-to-get-content-from* directory.
