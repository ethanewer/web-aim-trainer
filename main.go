package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"slices"
)

type Score struct {
    Name string `json:"name"`
    Score int `json:"score"`
}

type Msg struct {
	Leaderboard []Score `json:"leaderboard"`
	HighScore int `json:"highScore"`
}

var leaderboard []Score
var highscores map[string]int

func handleScore(w http.ResponseWriter, r *http.Request) {
	var scoreData Score
	err := json.NewDecoder(r.Body).Decode(&scoreData)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	
	name, score := scoreData.Name, scoreData.Score
	highScore, has := highscores[name]
	fmt.Println(name, score)
	
	if has {
		highscores[name] = max(highScore, score)
	} else {
		highscores[name] = score
	}
	
	n := len(leaderboard)
	updated := false
	for i := 0; i < n; i++ {
		if leaderboard[i].Name == name {
			leaderboard[i].Score = max(leaderboard[i].Score, score)
			updated = true
		}
	}
	
	if !updated && n < 10 {
		leaderboard = append(leaderboard, scoreData)
		slices.SortFunc(leaderboard, func(a, b Score) int { return b.Score - a.Score })
	} else if !updated && score >= leaderboard[n - 1].Score {
		leaderboard[n - 1] = scoreData
	}

	msg := Msg { Leaderboard: leaderboard, HighScore: max(highScore, score) }
	responseJSON, err := json.Marshal(msg)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(responseJSON)
}


func main() {
	leaderboard = []Score {{ Name: "Ethan", Score: 69 }}
	highscores = make(map[string]int)

	http.HandleFunc("/score", handleScore)

	http.Handle("/", http.FileServer(http.Dir("static/dist")))
	fmt.Println("Server at http://localhost:3000")
	log.Fatal(http.ListenAndServe(":3000", nil))
}