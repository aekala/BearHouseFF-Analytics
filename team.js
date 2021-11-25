class Team {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.results = [];
        this.wins = 0;
        this.losses = 0;
    }

    addWin() {
        this.results.push(1);
        this.wins += 1;
    }

    addLoss() {
        this.results.push(0);
        this.losses += 1
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

module.exports = Team;