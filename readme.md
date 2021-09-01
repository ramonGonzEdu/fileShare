# Simple file sharing software

This project aims to be a simple file sharing website that can be self hosted. 

When uploading a file, you are given 3 questions:
* Username
* totp password (Google Authenticator or similar)
* Whether or not the file is private (will ask for totp again before downloading, but is still in the file tree)