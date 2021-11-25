const dotenv = require('dotenv').config()
const express = require('express')
const app = express();
const port = 8000;
const fs = require('fs')
const { Client } = require("espn-fantasy-football-api/node-dev");
const myClient = new Client({ leagueId: 36007468 });
myClient.setCookies({ espnS2: process.env.ESPN_S2, SWID: process.env.SWID });
let data = "";

class Team {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.results = [];
        this.wins = 0;
        this.losses = 0;
    }

    getId() {
        return this.id;
    }

    getName() {
        return this.name;
    }

    getStandings() {
        return this.results;
    }

    addWin() {
        this.results.push(1);
    }

    addLoss() {
        this.results.push(0);
    }

    calculateResults() {
        let wins = 0;
        let losses = 0;
        this.results.forEach((result) => {
            if (result == 1) wins++;
            if (result == 0) losses++;
        });

        this.wins = wins;
        this.losses = losses;
    }

    //return standing for that week in season, 1-indexed
    getStandingForWeek(week) {
        if (week > 0 && week <= this.standings.length) {
            return this.standings.get(week-1);
        }
    }
}

app.get('/', async (req, res) => {
    // let data = "ID, Team Name\n";
    let teams = await initializeTeams();
    let gamesRes = "";
    let numWeeks = await getNumberOfWeeksInRegularSeason();

    teams = await analyzeSeason(teams, numWeeks);

    fs.writeFile('data.csv', data, (err) => {
        if (err) throw err;
        console.log('data.csv saved.');
    });
  res.send(gamesRes.toString())
});

async function initializeTeams() {
    teams = new Map();
    await myClient.getTeamsAtWeek({seasonId: 2020, scoringPeriodId: 1}).then((res) => {
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
    await myClient.getLeagueInfo({ seasonId: 2020 }).then((league) => {
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
        await myClient.getBoxscoreForWeek( { seasonId: 2020, scoringPeriodId: week, matchupPeriodId: week}).then((boxScores) => {
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

        for (let i = 1; i <= teams.size; i++) {
            const team = teams.get(i);
            team.calculateResults();
            teams.set(i, team);
        }
    }

    return teams;
}

app.listen(port, () => {
  console.log(`example app listening on port ${port}!`)
});
