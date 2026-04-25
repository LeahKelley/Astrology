package main

type Interpretation struct {
	Name        string `json:"name"`
	Symbol      string `json:"symbol"`
	Keywords    []string `json:"keywords"`
	Description string `json:"description"`
	InChart     string `json:"in_chart"`
}

var planets = map[string]Interpretation{
	"Sun": {
		Name:    "Sun",
		Symbol:  "☉",
		Keywords: []string{"identity", "ego", "vitality", "purpose", "will"},
		Description: "The Sun is the core of your natal chart — it represents your conscious self, the identity you build over a lifetime, and the energy you radiate outward. It is the archetype of the hero: purposeful, creative, and self-expressive.",
		InChart: "The Sun's sign shows your fundamental character and what makes you feel most alive. Its house reveals the area of life where you are meant to shine and where your sense of purpose is most strongly expressed.",
	},
	"Moon": {
		Name:    "Moon",
		Symbol:  "☽",
		Keywords: []string{"emotion", "instinct", "memory", "nurture", "habit"},
		Description: "The Moon governs your inner emotional world — the unconscious patterns, instincts, and needs that shape how you feel safe and nurtured. It reflects your relationship with your mother, home, and the past.",
		InChart: "The Moon's sign describes your emotional nature and what you need to feel secure. Its house points to the life area where emotions run deepest and where you seek comfort and belonging.",
	},
	"Mercury": {
		Name:    "Mercury",
		Symbol:  "☿",
		Keywords: []string{"communication", "intellect", "perception", "logic", "language"},
		Description: "Mercury is the planet of mind and communication — it governs how you think, speak, write, and process information. As the mythological messenger of the gods, it links the inner world of thought to the outer world of language.",
		InChart: "Mercury's sign shapes your communication style and how your mind works. Its house reveals the areas of life where your intellect is most active and where you gather and share information.",
	},
	"Venus": {
		Name:    "Venus",
		Symbol:  "♀",
		Keywords: []string{"love", "beauty", "pleasure", "values", "attraction"},
		Description: "Venus governs love, beauty, and what you find pleasurable or valuable. It shapes your aesthetic sensibilities, your approach to relationships, and the way you attract — and are attracted to — others.",
		InChart: "Venus's sign reveals your relationship style and what you find beautiful. Its house shows the area of life where you seek harmony, pleasure, and connection.",
	},
	"Mars": {
		Name:    "Mars",
		Symbol:  "♂",
		Keywords: []string{"drive", "action", "desire", "courage", "assertion"},
		Description: "Mars is the planet of action and desire — it governs how you pursue what you want, how you assert yourself, and how you handle conflict and competition. It is raw, initiating energy in its most focused form.",
		InChart: "Mars's sign describes your drive and how you take action. Its house shows where you apply your energy most forcefully and where you are most motivated to compete and achieve.",
	},
	"Jupiter": {
		Name:    "Jupiter",
		Symbol:  "♃",
		Keywords: []string{"expansion", "abundance", "wisdom", "optimism", "growth"},
		Description: "Jupiter is the great benefic — the planet of growth, abundance, and higher wisdom. It expands whatever it touches, bringing opportunity, optimism, and a desire to seek meaning through philosophy, travel, and learning.",
		InChart: "Jupiter's sign reveals your philosophy and how you seek growth. Its house points to the area of life where you are most fortunate, where opportunities abound, and where you can achieve great expansion.",
	},
	"Saturn": {
		Name:    "Saturn",
		Symbol:  "♄",
		Keywords: []string{"discipline", "structure", "karma", "limitation", "mastery"},
		Description: "Saturn is the planet of discipline, time, and consequence. It represents the structures and boundaries that define our lives — and the hard work required to achieve lasting mastery. Saturn rewards perseverance and demands accountability.",
		InChart: "Saturn's sign shows how you approach responsibility and where you must develop discipline. Its house marks the area of life where you face your greatest challenges — and where your deepest achievements are earned.",
	},
	"Uranus": {
		Name:    "Uranus",
		Symbol:  "♅",
		Keywords: []string{"revolution", "innovation", "freedom", "disruption", "awakening"},
		Description: "Uranus is the planet of sudden change and revolution. It breaks apart stagnant structures and awakens individuals to new possibilities. Where Uranus operates, expect the unexpected — flashes of insight, sudden reversals, and liberation from the status quo.",
		InChart: "Uranus's sign (shared by a generation) reflects the era's collective impulse toward change. Its house shows the area of your life most subject to sudden upheaval, innovation, and a drive for radical freedom.",
	},
	"Neptune": {
		Name:    "Neptune",
		Symbol:  "♆",
		Keywords: []string{"dreams", "spirituality", "illusion", "compassion", "dissolution"},
		Description: "Neptune governs dreams, spirituality, and the dissolution of ego boundaries. It is the planet of imagination, mysticism, and compassion — but also of deception, confusion, and escapism when its energy is misaligned.",
		InChart: "Neptune's sign (shared by a generation) describes the era's spiritual ideals. Its house shows where you are most idealistic, where boundaries are blurred, and where you may experience both transcendence and illusion.",
	},
	"Pluto": {
		Name:    "Pluto",
		Symbol:  "♇",
		Keywords: []string{"transformation", "power", "death", "rebirth", "depth"},
		Description: "Pluto governs deep transformation, power, and the cycle of death and rebirth. It rules the underworld of the psyche — the unconscious compulsions, buried truths, and radical metamorphoses that define turning points in a life.",
		InChart: "Pluto's sign (shared by a generation) marks the era's transformative power themes. Its house reveals where you undergo the most profound personal transformation — and where you may grapple with control, obsession, or regeneration.",
	},
	"ASC": {
		Name:    "Ascendant",
		Symbol:  "AC",
		Keywords: []string{"persona", "appearance", "first impression", "outer self", "rising sign"},
		Description: "The Ascendant (or Rising Sign) is the zodiac sign that was rising over the eastern horizon at the exact moment of your birth. It is the mask you wear — your outer personality, physical appearance, and the first impression you make on others.",
		InChart: "Your Ascendant sign shapes how others perceive you at first glance and how you instinctively approach new situations. It colors the entire chart and acts as a filter through which your Sun and Moon energies are expressed.",
	},
	"MC": {
		Name:    "Midheaven",
		Symbol:  "MC",
		Keywords: []string{"career", "public image", "ambition", "life path", "legacy"},
		Description: "The Midheaven (Medium Coeli) marks the highest point in your chart — the zenith of the sky at your birth. It represents your public life, career path, reputation, and the legacy you aspire to leave in the world.",
		InChart: "Your Midheaven sign reveals your vocational calling and how you are seen by the public. It points to the type of career or public role that will bring you the greatest sense of achievement and social recognition.",
	},
	"DSC": {
		Name:    "Descendant",
		Symbol:  "DC",
		Keywords: []string{"relationships", "partnerships", "shadow", "projection", "others"},
		Description: "The Descendant is directly opposite the Ascendant, marking the western horizon at birth. It governs close partnerships — romantic and business — and the qualities you seek in others, often representing projected or undeveloped aspects of yourself.",
		InChart: "Your Descendant sign describes what you are drawn to in a partner and what you may project onto others. It points to the complementary qualities that balance your Ascendant self-expression.",
	},
	"IC": {
		Name:    "Imum Coeli",
		Symbol:  "IC",
		Keywords: []string{"roots", "home", "ancestry", "private self", "foundation"},
		Description: "The Imum Coeli (IC) marks the lowest point of the chart — the nadir of the sky at birth. It represents your private inner world, your roots, family heritage, and the psychological foundation from which you operate.",
		InChart: "Your IC sign reveals your emotional foundation and relationship to home and family. It describes the private self hidden from the public eye and the ancestral patterns that shaped your sense of security.",
	},
}

var signs = map[string]Interpretation{
	"Aries": {
		Name:    "Aries",
		Symbol:  "♈",
		Keywords: []string{"initiative", "courage", "impulsiveness", "pioneer", "self"},
		Description: "Aries is the first sign of the zodiac — the spark of beginnings, the archetype of the warrior and pioneer. Ruled by Mars, it is cardinal fire: initiating, assertive, and driven by an instinctive need to act and forge ahead.",
		InChart: "Planets in Aries operate with urgency and directness. This is the sign of the self — independent, bold, and occasionally reckless. Aries energy is best expressed when channeled into courageous new starts.",
	},
	"Taurus": {
		Name:    "Taurus",
		Symbol:  "♉",
		Keywords: []string{"stability", "sensuality", "patience", "persistence", "security"},
		Description: "Taurus is fixed earth — deliberate, grounded, and deeply connected to the material world. Ruled by Venus, it values beauty, comfort, and the slow pleasures of the senses. It builds with patience and holds on with unwavering tenacity.",
		InChart: "Planets in Taurus operate steadily and with great endurance. This energy is most powerful when given time to develop without being rushed. Taurus is the sign of sustainable growth and embodied presence.",
	},
	"Gemini": {
		Name:    "Gemini",
		Symbol:  "♊",
		Keywords: []string{"curiosity", "communication", "adaptability", "duality", "wit"},
		Description: "Gemini is mutable air — quick, curious, and endlessly adaptable. Ruled by Mercury, it thrives on information, conversation, and the intellectual exchange of ideas. The Twins symbolize the dual nature of mind: both rational and mercurial.",
		InChart: "Planets in Gemini operate with versatility and a need for variety. This energy excels at connecting dots between disparate ideas and expressing itself through language, writing, or teaching.",
	},
	"Cancer": {
		Name:    "Cancer",
		Symbol:  "♋",
		Keywords: []string{"nurture", "emotion", "memory", "home", "protection"},
		Description: "Cancer is cardinal water — sensitive, intuitive, and deeply connected to the past and to family. Ruled by the Moon, it operates through feeling, memory, and a powerful instinct to protect and nurture those it loves.",
		InChart: "Planets in Cancer are colored by emotional sensitivity and a need for security. This energy is most at home in private, domestic settings and operates with a protective, caring quality.",
	},
	"Leo": {
		Name:    "Leo",
		Symbol:  "♌",
		Keywords: []string{"creativity", "pride", "generosity", "drama", "leadership"},
		Description: "Leo is fixed fire — radiant, dramatic, and powerfully self-expressive. Ruled by the Sun, it is the sign of the performer, the king, and the creative force. Leo energy demands recognition and thrives in the spotlight.",
		InChart: "Planets in Leo operate with warmth, confidence, and creative flair. This energy is at its best when it has a stage to perform on and an audience to inspire. Leo asks: 'How can I create something that will be remembered?'",
	},
	"Virgo": {
		Name:    "Virgo",
		Symbol:  "♍",
		Keywords: []string{"analysis", "service", "precision", "health", "discernment"},
		Description: "Virgo is mutable earth — analytical, practical, and relentlessly attentive to detail. Ruled by Mercury, it applies its mental sharpness to the physical world — refining, categorizing, and improving with methodical care.",
		InChart: "Planets in Virgo operate with precision and a drive to improve. This energy is most fulfilled when engaged in meaningful work that requires skill and craft. Virgo asks: 'How can this be done better?'",
	},
	"Libra": {
		Name:    "Libra",
		Symbol:  "♎",
		Keywords: []string{"balance", "harmony", "justice", "partnership", "aesthetics"},
		Description: "Libra is cardinal air — diplomatic, beauty-loving, and oriented toward the other. Ruled by Venus, it is the sign of relationship, negotiation, and the pursuit of fairness. Libra seeks balance in all things.",
		InChart: "Planets in Libra operate through relationship and a desire for harmony. This energy considers all sides before acting and is most at home in contexts requiring tact, collaboration, and aesthetic sensitivity.",
	},
	"Scorpio": {
		Name:    "Scorpio",
		Symbol:  "♏",
		Keywords: []string{"depth", "transformation", "power", "mystery", "intensity"},
		Description: "Scorpio is fixed water — intense, perceptive, and drawn to the hidden depths of experience. Ruled by Pluto (and traditionally Mars), it is the sign of transformation, secret knowledge, and the willingness to descend into darkness in order to be reborn.",
		InChart: "Planets in Scorpio operate with intensity and a need to penetrate beneath the surface. This energy is not afraid of pain or complexity; it investigates, probes, and transforms whatever it encounters.",
	},
	"Sagittarius": {
		Name:    "Sagittarius",
		Symbol:  "♐",
		Keywords: []string{"philosophy", "freedom", "adventure", "optimism", "truth"},
		Description: "Sagittarius is mutable fire — expansive, optimistic, and driven by a quest for meaning. Ruled by Jupiter, it is the sign of the philosopher, the explorer, and the truth-seeker who refuses to be confined by boundaries.",
		InChart: "Planets in Sagittarius operate with enthusiasm and a need for freedom and growth. This energy is most alive when exploring new ideas, cultures, or belief systems. It asks: 'What is the larger meaning of this?'",
	},
	"Capricorn": {
		Name:    "Capricorn",
		Symbol:  "♑",
		Keywords: []string{"ambition", "discipline", "authority", "endurance", "mastery"},
		Description: "Capricorn is cardinal earth — ambitious, disciplined, and driven by the desire to build something lasting. Ruled by Saturn, it is the sign of the elder, the executive, and the patient achiever who understands that greatness takes time.",
		InChart: "Planets in Capricorn operate with pragmatism and a long-term view. This energy is most effective when given clear goals and enough time to work toward them methodically. Capricorn asks: 'What am I building that will endure?'",
	},
	"Aquarius": {
		Name:    "Aquarius",
		Symbol:  "♒",
		Keywords: []string{"innovation", "humanity", "rebellion", "detachment", "vision"},
		Description: "Aquarius is fixed air — visionary, unconventional, and oriented toward the collective. Ruled by Uranus (and traditionally Saturn), it is the sign of the reformer, the inventor, and the humanitarian who sees beyond what is to what could be.",
		InChart: "Planets in Aquarius operate with intellectual detachment and a drive for originality. This energy is most vital when working toward a larger social vision. Aquarius asks: 'How does this serve the whole?'",
	},
	"Pisces": {
		Name:    "Pisces",
		Symbol:  "♓",
		Keywords: []string{"compassion", "spirituality", "imagination", "dissolution", "empathy"},
		Description: "Pisces is mutable water — fluid, compassionate, and attuned to the invisible. Ruled by Neptune (and traditionally Jupiter), it is the sign of the mystic, the poet, and the healer who perceives the oneness beneath all apparent separation.",
		InChart: "Planets in Pisces operate with sensitivity, imagination, and a tendency to transcend ordinary reality. This energy is most powerful in creative, spiritual, or healing contexts where the boundaries of self can be safely surrendered.",
	},
}

var houses = map[int]Interpretation{
	1: {
		Name:    "First House",
		Symbol:  "I",
		Keywords: []string{"self", "identity", "appearance", "beginnings", "body"},
		Description: "The First House is the house of self — your physical body, personal identity, and the outer personality you project into the world. It begins at the Ascendant and governs how you initiate action and how you appear to others at first encounter.",
		InChart: "Planets in the First House are prominently expressed and closely tied to your sense of identity. They strongly color your appearance, demeanor, and instinctive approach to new situations.",
	},
	2: {
		Name:    "Second House",
		Symbol:  "II",
		Keywords: []string{"money", "possessions", "values", "resources", "security"},
		Description: "The Second House governs personal resources — money, possessions, and the material security you build. More deeply, it reflects your value system: what you consider worth having, and the relationship between self-worth and net worth.",
		InChart: "Planets in the Second House influence your relationship with money, resources, and what you consider valuable. They shape how you earn, spend, and derive a sense of security from the material world.",
	},
	3: {
		Name:    "Third House",
		Symbol:  "III",
		Keywords: []string{"communication", "siblings", "local travel", "learning", "perception"},
		Description: "The Third House governs communication, the immediate environment, and early education. It rules your relationship with siblings and neighbors, your local community, and the everyday exchange of information through language and short journeys.",
		InChart: "Planets in the Third House color how you communicate and think about your immediate world. They influence your speaking and writing style, your relationship with siblings, and how you gather and share everyday information.",
	},
	4: {
		Name:    "Fourth House",
		Symbol:  "IV",
		Keywords: []string{"home", "family", "roots", "private self", "ancestry"},
		Description: "The Fourth House is the foundation of the chart — it governs home, family, ancestry, and your deepest psychological roots. It is the most private sector of the horoscope and describes both your childhood and your later relationship with home-making.",
		InChart: "Planets in the Fourth House are felt most deeply in private life. They shape your experience of home and family, your relationship with your parents (especially the mother or more nurturing parent), and your emotional foundation.",
	},
	5: {
		Name:    "Fifth House",
		Symbol:  "V",
		Keywords: []string{"creativity", "romance", "pleasure", "children", "play"},
		Description: "The Fifth House governs creative self-expression, pleasure, romance, and children. It is the house of play, performance, and the joy of making something uniquely your own — from art to games to love affairs.",
		InChart: "Planets in the Fifth House energize your creative and romantic life. They shape how you play, what brings you joy, your relationship with children, and the way you express your unique creative gifts.",
	},
	6: {
		Name:    "Sixth House",
		Symbol:  "VI",
		Keywords: []string{"health", "work", "routine", "service", "improvement"},
		Description: "The Sixth House governs health, daily work, and service. It rules the habits and routines that sustain your physical wellbeing and the quality of your everyday work life — including how you serve others and how you maintain your body and environment.",
		InChart: "Planets in the Sixth House influence your health, work habits, and relationship to service. They shape how you manage the practical details of daily life and how you approach wellness, work, and the desire to be of use.",
	},
	7: {
		Name:    "Seventh House",
		Symbol:  "VII",
		Keywords: []string{"partnership", "marriage", "contracts", "open enemies", "others"},
		Description: "The Seventh House governs close partnerships — romantic and business — and begins at the Descendant. It represents the 'other' in your life: those you commit to in formal relationships, as well as the qualities you project onto others or seek in a partner.",
		InChart: "Planets in the Seventh House shape your approach to partnership and commitment. They reveal what you seek in a partner, what you project onto close relationships, and how you navigate contracts and formal alliances.",
	},
	8: {
		Name:    "Eighth House",
		Symbol:  "VIII",
		Keywords: []string{"transformation", "shared resources", "death", "sexuality", "occult"},
		Description: "The Eighth House governs deep transformation, shared resources, sexuality, and mortality. It rules the energy that flows between you and others at the deepest level — joint finances, inheritances, psychological merging, and the process of radical change through crisis and rebirth.",
		InChart: "Planets in the Eighth House operate in the realm of depth and intensity. They influence how you handle shared finances and power, your experience of sexuality and intimacy, and the transformative crises that fundamentally change you.",
	},
	9: {
		Name:    "Ninth House",
		Symbol:  "IX",
		Keywords: []string{"philosophy", "travel", "higher learning", "belief", "expansion"},
		Description: "The Ninth House governs higher education, long-distance travel, philosophy, and spiritual belief. It is the house of the quest for meaning — the search for a worldview or set of principles that gives life purpose and direction.",
		InChart: "Planets in the Ninth House shape your philosophical outlook and spiritual seeking. They influence how you explore the world — through travel, study, or belief — and what kind of meaning you ultimately seek.",
	},
	10: {
		Name:    "Tenth House",
		Symbol:  "X",
		Keywords: []string{"career", "public reputation", "authority", "ambition", "legacy"},
		Description: "The Tenth House is the most visible sector of the chart, beginning at the Midheaven. It governs career, public reputation, social status, and the legacy you build in the world. It also describes your relationship with authority figures and with authority itself.",
		InChart: "Planets in the Tenth House are prominently public-facing. They strongly influence your career path, reputation, and ambitions. They reveal how you interact with authority and what you are driven to achieve in the eyes of the world.",
	},
	11: {
		Name:    "Eleventh House",
		Symbol:  "XI",
		Keywords: []string{"community", "friendship", "groups", "ideals", "future"},
		Description: "The Eleventh House governs friendships, social groups, and collective ideals. It is the house of belonging to something larger than yourself — the communities, organizations, and networks through which your individual gifts can serve a broader vision.",
		InChart: "Planets in the Eleventh House influence your social life, group affiliations, and sense of collective purpose. They shape your friendships, your involvement in communities or causes, and the role you play in larger networks.",
	},
	12: {
		Name:    "Twelfth House",
		Symbol:  "XII",
		Keywords: []string{"solitude", "hidden self", "karma", "surrender", "spirituality"},
		Description: "The Twelfth House is the most hidden sector of the chart — it governs the unconscious, solitude, karma, and spiritual retreat. It rules what is concealed from view: secret enemies, self-undoing, confinement, and the vast interior world of dream, symbol, and soul.",
		InChart: "Planets in the Twelfth House operate below the threshold of ordinary consciousness. They can describe hidden strengths or unconscious self-sabotage, spiritual gifts or unexplored fears. This is the house of what we carry without knowing it.",
	},
}

var aspects = map[string]Interpretation{
	"conjunction": {
		Name:    "Conjunction",
		Symbol:  "☌",
		Keywords: []string{"fusion", "intensity", "unity", "power", "focus"},
		Description: "A conjunction occurs when two planets occupy the same degree (within ~8°). Their energies merge and amplify each other — for better or worse, depending on the planets involved. A conjunction is the most powerful aspect, creating a concentrated point of intense focus.",
		InChart: "Conjunctions blend two planetary principles into one expression. The result depends on the planets: Sun conjunct Jupiter brings expansive confidence, while Sun conjunct Saturn can create a tension between vitality and restriction.",
	},
	"opposition": {
		Name:    "Opposition",
		Symbol:  "☍",
		Keywords: []string{"tension", "awareness", "polarity", "balance", "projection"},
		Description: "An opposition occurs when two planets are 180° apart. The two principles pull against each other, creating awareness through tension and contrast. Oppositions often manifest as conflicts between inner drives and outer relationships, requiring conscious integration.",
		InChart: "Oppositions create a see-saw dynamic — you may swing between the two planetary energies or project one onto others. The key is to hold both sides of the polarity consciously, finding balance rather than resolving the tension by eliminating one pole.",
	},
	"square": {
		Name:    "Square",
		Symbol:  "□",
		Keywords: []string{"challenge", "friction", "growth", "motivation", "crisis"},
		Description: "A square occurs when two planets are 90° apart. It is the aspect of friction and challenge — the two planets operate at cross-purposes, generating tension that demands action and resolution. Squares are powerful motivators for growth, though often uncomfortable.",
		InChart: "Squares are the engine of achievement. The friction they create pushes you to develop skills and overcome obstacles you might otherwise avoid. The challenge of a square is to find a way to honor both planetary principles without one suppressing the other.",
	},
	"trine": {
		Name:    "Trine",
		Symbol:  "△",
		Keywords: []string{"harmony", "ease", "talent", "flow", "grace"},
		Description: "A trine occurs when two planets are 120° apart, typically in the same element (fire, earth, air, or water). It is the aspect of natural harmony and ease — the two planetary energies flow together effortlessly, producing talent and graceful expression.",
		InChart: "Trines represent areas of natural gift — places where things come easily. The shadow side of trines is complacency: because the energy flows so smoothly, you may not develop these gifts as fully as you would through the friction of squares and oppositions.",
	},
	"sextile": {
		Name:    "Sextile",
		Symbol:  "⚹",
		Keywords: []string{"opportunity", "cooperation", "creativity", "skills", "support"},
		Description: "A sextile occurs when two planets are 60° apart. It is a harmonious aspect like the trine, but more active — sextiles represent opportunities that require some effort to realize. The two planetary energies support and stimulate each other, opening doors that you must choose to walk through.",
		InChart: "Sextiles indicate areas of talent and opportunity that are available but not automatic. Unlike trines, they reward effort — they create favorable conditions for growth in the areas of life they touch, but you must take the initiative to develop them.",
	},
}
