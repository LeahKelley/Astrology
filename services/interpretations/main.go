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

	mux.HandleFunc("/interpret/combo/planet-in-sign", handlePlanetInSign)
	mux.HandleFunc("/interpret/combo/planet-in-house", handlePlanetInHouse)
	mux.HandleFunc("/interpret/combo/house-cusp", handleHouseCusp)
	mux.HandleFunc("/interpret/combo/aspect", handleAspectCombo)

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
	case "asc", "ascendant", "as":
		name = "ASC"
	case "dsc", "descendant", "ds":
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

func handlePlanetInSign(w http.ResponseWriter, r *http.Request) {
	planet := strings.TrimSpace(r.URL.Query().Get("planet"))
	sign := strings.TrimSpace(r.URL.Query().Get("sign"))
	if planet == "" || sign == "" {
		writeError(w, http.StatusBadRequest, "planet and sign are required")
		return
	}
	planet = normalizePlanet(planet)
	sign = strings.ToUpper(sign[:1]) + strings.ToLower(sign[1:])
	retrograde := strings.ToLower(r.URL.Query().Get("retrograde")) == "true"
	writeJSON(w, http.StatusOK, composePlanetInSign(planet, sign, retrograde))
}

func handlePlanetInHouse(w http.ResponseWriter, r *http.Request) {
	planet := strings.TrimSpace(r.URL.Query().Get("planet"))
	houseStr := strings.TrimSpace(r.URL.Query().Get("house"))
	if planet == "" || houseStr == "" {
		writeError(w, http.StatusBadRequest, "planet and house are required")
		return
	}
	houseNum, err := strconv.Atoi(houseStr)
	if err != nil || houseNum < 1 || houseNum > 12 {
		writeError(w, http.StatusBadRequest, "house must be 1–12")
		return
	}
	planet = normalizePlanet(planet)
	writeJSON(w, http.StatusOK, composePlanetInHouse(planet, houseNum))
}

func handleHouseCusp(w http.ResponseWriter, r *http.Request) {
	houseStr := strings.TrimSpace(r.URL.Query().Get("house"))
	sign := strings.TrimSpace(r.URL.Query().Get("sign"))
	if houseStr == "" || sign == "" {
		writeError(w, http.StatusBadRequest, "house and sign are required")
		return
	}
	houseNum, err := strconv.Atoi(houseStr)
	if err != nil || houseNum < 1 || houseNum > 12 {
		writeError(w, http.StatusBadRequest, "house must be 1–12")
		return
	}
	sign = strings.ToUpper(sign[:1]) + strings.ToLower(sign[1:])
	writeJSON(w, http.StatusOK, composeHouseCusp(houseNum, sign))
}

func handleAspectCombo(w http.ResponseWriter, r *http.Request) {
	planet1 := strings.TrimSpace(r.URL.Query().Get("planet1"))
	aspectType := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("aspect")))
	planet2 := strings.TrimSpace(r.URL.Query().Get("planet2"))
	if planet1 == "" || aspectType == "" || planet2 == "" {
		writeError(w, http.StatusBadRequest, "planet1, aspect, and planet2 are required")
		return
	}
	planet1 = normalizePlanet(planet1)
	planet2 = normalizePlanet(planet2)
	writeJSON(w, http.StatusOK, composeAspectCombo(planet1, aspectType, planet2))
}

func normalizePlanet(name string) string {
	switch strings.ToLower(name) {
	case "asc", "ascendant", "as":
		return "ASC"
	case "dsc", "descendant", "ds":
		return "DSC"
	case "mc", "midheaven":
		return "MC"
	case "ic":
		return "IC"
	default:
		return strings.ToUpper(name[:1]) + strings.ToLower(name[1:])
	}
}
