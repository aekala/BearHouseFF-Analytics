# BearHouseFF-Analytics
## Background
Tool for grabbing 2020 historical data for Bear House Fantasy Football and generating a .CSV for weekly matchups and standings.

Built using mkreiser's npm package for an API wrapper to connect to ESPN's Fantasy Football API. 
## Instructions
1) `git clone https://github.com/leokodish/BearHouseFF-Analytics`
2) `cd BearHouseFF-Analytics`
3) `npm install`
4) Set ESPN_S2, SWID, and LEAGUE_ID in .env (LEAGUE_ID can be found by going to your league's page at fantasy.espn.com and getting it from the URL, refer to https://github.com/mkreiser/ESPN-Fantasy-Football-API on how to get ESPN_S2 and SWID. 
5)  `node index.js` 
