package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
)

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("/health", handleHealth)
	mux.HandleFunc("/interpret/planets", handleAllPlanets)
	mux.HandleFunc("/interpret/signs", handleAllSigns)
	mux.HandleFunc("/interpret/houses", handleAllHouses)
	mux.HandleFunc("/interpret/aspects", handleAllAspects)
	mux.HandleFunc("/interpret/planet/", handlePlanet)
	mux.HandleFunc("/interpret/sign/", handleSign)
	mux.HandleFunc("/interpret/house/", handleHouse)
	mux.HandleFunc("/interpret/aspect/", handleAspect)

	log.Println("Interpretations service listening on :8002")
	log.Fatal(http.ListenAndServe(":8002", corsMiddleware(mux)))
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok", "service": "interpretations"})
}

func handlePlanet(w http.ResponseWriter, r *http.Request) {
	name := strings.TrimPrefix(r.URL.Path, "/interpret/planet/")
	name = strings.TrimSpace(name)
	if name == "" {
		writeError(w, http.StatusBadRequest, "planet name required")
		return
	}
	// Normalize: capitalize first letter, lowercase rest (e.g. "sun" → "Sun")
	name = strings.ToUpper(name[:1]) + strings.ToLower(name[1:])
	// Special cases for multi-word names
	switch strings.ToLower(name) {
	case "asc", "ascendant":
		name = "ASC"
	case "dsc", "descendant":
		name = "DSC"
	case "mc", "midheaven":
		name = "MC"
	case "ic":
		name = "IC"
	}
	interp, ok := planets[name]
	if !ok {
		writeError(w, http.StatusNotFound, fmt.Sprintf("planet '%s' not found", name))
		return
	}
	writeJSON(w, http.StatusOK, interp)
}

func handleSign(w http.ResponseWriter, r *http.Request) {
	name := strings.TrimPrefix(r.URL.Path, "/interpret/sign/")
	name = strings.TrimSpace(name)
	if name == "" {
		writeError(w, http.StatusBadRequest, "sign name required")
		return
	}
	name = strings.ToUpper(name[:1]) + strings.ToLower(name[1:])
	interp, ok := signs[name]
	if !ok {
		writeError(w, http.StatusNotFound, fmt.Sprintf("sign '%s' not found", name))
		return
	}
	writeJSON(w, http.StatusOK, interp)
}

func handleHouse(w http.ResponseWriter, r *http.Request) {
	raw := strings.TrimPrefix(r.URL.Path, "/interpret/house/")
	raw = strings.TrimSpace(raw)
	if raw == "" {
		writeError(w, http.StatusBadRequest, "house number required")
		return
	}
	num, err := strconv.Atoi(raw)
	if err != nil || num < 1 || num > 12 {
		writeError(w, http.StatusBadRequest, "house number must be 1–12")
		return
	}
	interp, ok := houses[num]
	if !ok {
		writeError(w, http.StatusNotFound, fmt.Sprintf("house %d not found", num))
		return
	}
	writeJSON(w, http.StatusOK, interp)
}

func handleAspect(w http.ResponseWriter, r *http.Request) {
	name := strings.TrimPrefix(r.URL.Path, "/interpret/aspect/")
	name = strings.ToLower(strings.TrimSpace(name))
	if name == "" {
		writeError(w, http.StatusBadRequest, "aspect type required")
		return
	}
	interp, ok := aspects[name]
	if !ok {
		writeError(w, http.StatusNotFound, fmt.Sprintf("aspect '%s' not found", name))
		return
	}
	writeJSON(w, http.StatusOK, interp)
}

func handleAllPlanets(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, planets)
}

func handleAllSigns(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, signs)
}

func handleAllHouses(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, houses)
}

func handleAllAspects(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, aspects)
}
