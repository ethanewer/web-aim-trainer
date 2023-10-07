package main

import (
	"fmt"
	"log"
	"net/http"
)

func main() {
	http.Handle("/", http.FileServer(http.Dir("static/dist")))
	fmt.Println("Server at http://localhost:3000")
	log.Fatal(http.ListenAndServe(":3000", nil))
}