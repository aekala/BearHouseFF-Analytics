const dotenv = require('dotenv').config()
const express = require('express')
const app = express();
const port = 8000;
const fs = require('fs')
const { Client } = require("espn-fantasy-football-api/node-dev");
const myClient = new Client({ leagueId: 36007468 });   
myClient.setCookies({ espnS2: process.env.ESPN_S2, SWID: process.env.SWID });
const Team = require('./team.js');
let data = "";  // data to be written to .csv
const season = 2020;   

app.get('/', async (req, res) => {
    //get team names
    let teams = await initializeTeams();
    let gamesRes = "";
    let numWeeks = await getNumberOfWeeksInRegularSeason();

    //run through season and log matchups, wins, losses
    teams = await analyzeSeason(teams, numWeeks);

    fs.writeFile('data.csv', data, (err) => {
        if (err) throw err;
        console.log('data.csv saved.');
    });
  res.send(gamesRes.toString())
});

async function initializeTeams() {
    teams = new Map();
    await myClient.getTeamsAtWeek({seasonId: season, scoringPeriodId: 1}).then((res) => {
      res.forEach(team => {
          teams.set(team.id, new Team(team.id, team.name));
      })
    }).catch((err) => {
        console.error(err);
    });
    return teams;
}

async function getNumberOfWeeksInRegularSeason() {
    let numWeeks = 0;
    await myClient.getLeagueInfo({ seasonId: season }).then((league) => {
        numWeeks = league.scheduleSettings.numberOfRegularSeasonMatchups;
    }).catch((err) => {
        console.error(err);
    });
    return numWeeks;
}

async function analyzeSeason(teams, numWeeks) {
    for (let week = 1; week <= numWeeks; week++) {
        console.log(week);
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

app.listen(port, () => {
  console.log(`example app listening on port ${port}!`)
});
