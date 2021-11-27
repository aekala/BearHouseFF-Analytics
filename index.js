const dotenv = require('dotenv').config()
const express = require('express')
const app = express();
const port = 8000;
const fs = require('fs')
const { Client } = require("espn-fantasy-football-api/node-dev");
const myClient = new Client({ leagueId: process.env.LEAGUE_ID });   
myClient.setCookies({ espnS2: process.env.ESPN_S2, SWID: process.env.SWID });
const Team = require('./team.js');
let data = "";  // data to be written to .csv
const season = 2020;   

async function analyzeBearHouse() {
    //get team names
    let teams = await initializeTeams();
    let numWeeks = await getNumberOfWeeksInRegularSeason();

    //run through season and log matchups, wins, losses
    teams = await analyzeSeason(teams, numWeeks);
    fs.writeFileSync('data.csv', data, (err) => {
        if (err) throw err;
    });

    console.log("Wrote to data.csv!");
}

async function initializeTeams() {
    console.log("Initializing teams...");
    teams = new Map();
    await myClient.getTeamsAtWeek({seasonId: season, scoringPeriodId: 1}).then((res) => {
      res.forEach(team => {
          teams.set(team.id, new Team(team.id, team.name));
      })
    }).catch((err) => {
        console.error(err);
    });
    console.log(`Found ${teams.size} teams in league ${process.env.LEAGUE_ID}!`)
    return teams;
}

async function getNumberOfWeeksInRegularSeason() {
    console.log(`Determining number of regular season weeks in league ${process.env.LEAGUE_ID}...`);
    let numWeeks = 0;
    await myClient.getLeagueInfo({ seasonId: season }).then((league) => {
        numWeeks = league.scheduleSettings.numberOfRegularSeasonMatchups;
    }).catch((err) => {
        console.error(err);
    });
    console.log(`League ${process.env.LEAGUE_ID} has ${numWeeks} weeks in its regular season!`)
    return numWeeks;
}

async function analyzeSeason(teams, numWeeks) {
    for (let week = 1; week <= numWeeks; week++) {
        console.log(`Analyzing week ${week}...`);
        data += `Week ${week}\nHome Team,Home Score,,Away Team, Away Score\n`
        await myClient.getBoxscoreForWeek( { seasonId: season, scoringPeriodId: week, matchupPeriodId: week}).then((boxScores) => {
            boxScores.forEach((boxScore) => {
                const homeTeam = teams.get(boxScore.homeTeamId);
                const awayTeam = teams.get(boxScore.awayTeamId);
                data += `${homeTeam.name},${boxScore.homeScore},,${awayTeam.name},${boxScore.awayScore}\n`;
                if (boxScore.homeScore > boxScore.awayScore) {
                    homeTeam.addWin();
                    awayTeam.addLoss();
                } else {
                    homeTeam.addLoss();
                    awayTeam.addWin();
                }

                teams.set(boxScore.homeTeamId, homeTeam);
                teams.set(boxScore.awayTeamId, awayTeam);
            })
        }).catch((err) => {
            console.error(err);
        }).finally(() => {
            data += "\n\n";
        });
 
        writeWeeklyStandingsToData(week, teams);
    }
    return teams;
}

function writeWeeklyStandingsToData(week, teams) {
    data += `Week ${week} Standings\nTeam Name,Wins,Losses\n`;
    let weeklyTeamStandings = sortTeamStandingsByWins(teams);
    weeklyTeamStandings.forEach(team => {
        data += `${team.name},${team.wins},${team.losses}\n`;
    })
    data += "\n\n";
}

function sortTeamStandingsByWins(teams) {
    let teamsArray = [];
    teams.forEach((team) => {
        teamsArray.push(team);
    });
    teamsArray.sort(compareWins);
    return teamsArray;
}

//comparator function for sortTeamStandingsByWins
function compareWins(a, b) {
  if (a.wins < b.wins) {
    return 1;
  }
  if (a.wins > b.wins) {
    return -1;
  }
  return 0;
}

app.listen(port, async () => {
  console.log("Bear House Fantasy Football Analysis Tool booted up!");
  await analyzeBearHouse();
  console.log("Bear House Fantasy Football Analysis Tool finished!")
  process.exit();
});
