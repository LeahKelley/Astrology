package main

import (
	"fmt"
	"strings"
)

type ComboInterpretation struct {
	Title    string   `json:"title"`
	Text     string   `json:"text"`
	Keywords []string `json:"keywords"`
}

var retrogradeDescriptions = map[string]string{
	"Mercury": "Mercury retrograde in the natal chart turns the planet's communicative and analytical energies inward. You likely have a reflective, introspective thinking style — processing ideas deeply before expressing them. This placement correlates with rich inner monologue, a tendency to revise and reconsider, and insight gained through turning the mind back on itself. Writing, art, or other non-linear modes of expression may come more naturally than spontaneous speech.",
	"Venus":   "Venus retrograde in the natal chart means the planet's capacity for love, beauty, and connection operates beneath the surface. Your approach to relationships and values may be unconventional, late-blooming, or deeply internalized. You may experience love as something requiring unusual introspection or revisiting. Over time, retrograde Venus natives typically develop a profoundly personal and authentic sense of what they find beautiful and whom they love — earned through reflection rather than inherited from social convention.",
	"Mars":    "Mars retrograde in the natal chart redirects the planet's assertive drive inward. Rather than projecting energy outward in bold, immediate action, you tend to internalize ambition, process anger reflectively, and act with deliberation rather than impulse. This placement can indicate a slow-burning but highly focused will — one that achieves its aims through careful timing and internal momentum. Channeling this energy constructively, rather than turning it against yourself, is a core life theme.",
	"Jupiter": "Jupiter retrograde in the natal chart turns the planet's expansive quest for meaning inward. You tend to develop your philosophy, spirituality, and sense of purpose through personal experience and inner reflection rather than through conventional education, religion, or social institutions. Your greatest growth comes from questioning received wisdom and forging your own understanding. This placement rewards independent thinkers who trust their inner compass over external authority.",
	"Saturn":  "Saturn retrograde in the natal chart deeply internalizes the planet's lessons around discipline, authority, and structure. You may carry an early-developed or heightened sense of responsibility, or you may have had complicated relationships with authority figures that ultimately pushed you toward self-mastery. The gift of natal Saturn retrograde is profound personal integrity — a rigorous set of inner standards you build from within, not merely imposed from without.",
	"Uranus":  "Uranus retrograde in the natal chart (a common placement, as Uranus is retrograde roughly five months per year) turns the planet's revolutionary and awakening energy inward. Rather than dramatic external rebellions, your drive for freedom and originality tends to express through internal transformation and an unconventional inner life. You may appear traditional on the surface while harboring deeply radical perspectives. This placement correlates with sudden internal breakthroughs and a powerful individualism that emerges gradually over time.",
	"Neptune": "Neptune retrograde in the natal chart (another common placement) intensifies the planet's spiritual and imaginative energies as an interior phenomenon. Your spiritual development tends to unfold through personal experience, dreams, and inner revelation rather than organized religion or collective movements. The boundaries between imagination and reality may be especially fluid, and your inner world is likely unusually rich and complex. This placement rewards contemplative and artistic paths that honor the invisible dimensions of experience.",
	"Pluto":   "Pluto retrograde in the natal chart (very common, as Pluto is retrograde roughly half the year) turns the planet's transformative and power-related themes inward. Your most profound metamorphoses tend to happen in private — not through dramatic external events, but through deep internal shifts in consciousness. You are likely intensely private about your shadow side and deepest desires. Transformation is a slow, subterranean process that only becomes visible across long stretches of time, but the changes it produces are thorough and permanent.",
}

func composePlanetInSign(planetName, signName string, retrograde bool) ComboInterpretation {
	p, hasP := planets[planetName]
	s, hasS := signs[signName]

	title := planetName + " in " + signName
	if retrograde {
		title += " (Retrograde)"
	}

	var sb strings.Builder

	// Use the specific written interpretation if available
	lookupKey := planetName + "_" + signName
	if specific, ok := planetInSignText[lookupKey]; ok {
		sb.WriteString(specific)
	} else if hasP && hasS {
		pkw := strings.Join(p.Keywords[:min(2, len(p.Keywords))], " and ")
		skw := strings.Join(s.Keywords[:min(2, len(s.Keywords))], " and ")
		sb.WriteString(fmt.Sprintf(
			"With your %s in %s, the planetary principle of %s — associated with %s — expresses itself through the lens of %s, the sign of %s.\n\n",
			planetName, signName, planetName, pkw, signName, skw,
		))
		sb.WriteString(p.InChart)
		sb.WriteString("\n\n")
		sb.WriteString(s.InChart)
	} else {
		sb.WriteString("Interpretation not available.")
	}

	if retrograde {
		if rDesc, ok := retrogradeDescriptions[planetName]; ok {
			sb.WriteString("\n\nRetrograde influence: ")
			sb.WriteString(rDesc)
		}
	}

	kw := []string{}
	if hasP {
		kw = append(kw, p.Keywords...)
	}
	if hasS {
		kw = append(kw, s.Keywords...)
	}

	return ComboInterpretation{Title: title, Text: sb.String(), Keywords: kw}
}

func composePlanetInHouse(planetName string, houseNum int) ComboInterpretation {
	p, hasP := planets[planetName]
	h, hasH := houses[houseNum]

	title := fmt.Sprintf("%s in House %d", planetName, houseNum)

	var sb strings.Builder

	lookupKey := fmt.Sprintf("%s_%d", planetName, houseNum)
	if specific, ok := planetInHouseText[lookupKey]; ok {
		sb.WriteString(specific)
	} else if hasP && hasH {
		pkw := strings.Join(p.Keywords[:min(2, len(p.Keywords))], " and ")
		hkw := strings.Join(h.Keywords[:min(2, len(h.Keywords))], " and ")
		sb.WriteString(fmt.Sprintf(
			"With your %s in the %s, the planet's themes of %s are active in the life area governed by %s — the domain of %s.\n\n",
			planetName, h.Name, pkw, h.Name, hkw,
		))
		sb.WriteString(p.InChart)
		sb.WriteString("\n\n")
		sb.WriteString(h.InChart)
	} else {
		sb.WriteString("Interpretation not available.")
	}

	kw := []string{}
	if hasP {
		kw = append(kw, p.Keywords...)
	}
	if hasH {
		kw = append(kw, h.Keywords...)
	}

	return ComboInterpretation{Title: title, Text: sb.String(), Keywords: kw}
}

func composeHouseCusp(houseNum int, signName string) ComboInterpretation {
	h, hasH := houses[houseNum]
	s, hasS := signs[signName]

	title := fmt.Sprintf("House %d in %s", houseNum, signName)

	var sb strings.Builder

	lookupKey := fmt.Sprintf("%d_%s", houseNum, signName)
	if specific, ok := houseCuspText[lookupKey]; ok {
		sb.WriteString(specific)
	} else if hasH && hasS {
		hkw := strings.Join(h.Keywords[:min(2, len(h.Keywords))], " and ")
		skw := strings.Join(s.Keywords[:min(2, len(s.Keywords))], " and ")

		sb.WriteString(fmt.Sprintf(
			"With the cusp of your %s falling in %s, the life area of %s is colored by %s's qualities of %s.\n\n",
			h.Name, signName, hkw, signName, skw,
		))
		sb.WriteString(h.InChart)
		sb.WriteString("\n\n")
		sb.WriteString(s.InChart)
	} else {
		sb.WriteString("Interpretation not available.")
	}

	kw := []string{}
	if hasH {
		kw = append(kw, h.Keywords...)
	}
	if hasS {
		kw = append(kw, s.Keywords...)
	}

	return ComboInterpretation{Title: title, Text: sb.String(), Keywords: kw}
}

func composeAspectCombo(planet1, aspectType, planet2 string) ComboInterpretation {
	p1, hasP1 := planets[planet1]
	p2, hasP2 := planets[planet2]
	a, hasA := aspects[aspectType]

	title := fmt.Sprintf("%s %s %s", planet1, aspectType, planet2)

	var sb strings.Builder

	fwdKey := planet1 + "_" + aspectType + "_" + planet2
	revKey := planet2 + "_" + aspectType + "_" + planet1
	if specific, ok := aspectComboText[fwdKey]; ok {
		sb.WriteString(specific)
	} else if specific, ok := aspectComboText[revKey]; ok {
		sb.WriteString(specific)
	} else if hasP1 && hasP2 && hasA {
		akw := strings.Join(a.Keywords[:min(2, len(a.Keywords))], " and ")
		p1kw := strings.Join(p1.Keywords[:min(2, len(p1.Keywords))], " and ")
		p2kw := strings.Join(p2.Keywords[:min(2, len(p2.Keywords))], " and ")

		sb.WriteString(fmt.Sprintf(
			"In your chart, %s forms a %s with %s — an aspect of %s. This brings together %s's themes of %s and %s's themes of %s.\n\n",
			planet1, aspectType, planet2, akw,
			planet1, p1kw, planet2, p2kw,
		))
		sb.WriteString(a.InChart)
		sb.WriteString("\n\n")
		sb.WriteString(fmt.Sprintf("%s: %s", planet1, p1.Description))
		sb.WriteString("\n\n")
		sb.WriteString(fmt.Sprintf("%s: %s", planet2, p2.Description))
	} else {
		sb.WriteString("Interpretation not available.")
	}

	kw := []string{}
	if hasA {
		kw = append(kw, a.Keywords...)
	}
	if hasP1 {
		kw = append(kw, p1.Keywords[:min(2, len(p1.Keywords))]...)
	}
	if hasP2 {
		kw = append(kw, p2.Keywords[:min(2, len(p2.Keywords))]...)
	}

	return ComboInterpretation{Title: title, Text: sb.String(), Keywords: kw}
}
