import random

DAILY_TEXT = {
    "Work": {
        "green": [
            "High energy today. Tackle your hardest tasks first.",
            "Great momentum. Perfect day to launch or pitch.",
            "Frictionless productivity. You're in the zone."
        ],
        "yellow": [
            "Steady pace. Stick to routine tasks today.",
            "Business as usual. No need to rush.",
            "Maintain your current momentum; avoid starting new massive projects."
        ],
        "red": [
            "High risk of burnout. Do the minimum and log off.",
            "Expect delays or friction. Don't force outcomes today.",
            "Patience required. Not a good day for high-stakes decisions."
        ]
    },
    "Social": {
        "green": [
            "Your charm is high. Great evening for a date or networking.",
            "People are drawn to you today. Say yes to invitations.",
            "Warm and communicative energy. Reach out to an old friend."
        ],
        "yellow": [
            "A quiet social day. Good for 1-on-1s rather than big groups.",
            "Keep it casual. Low-stakes hangs are best tonight.",
            "Neutral energy. Focus on your inner circle."
        ],
        "red": [
            "Miscommunications are likely. Think before you text.",
            "You might feel socially drained. Guard your peace.",
            "Potential for friction. Not the best day to resolve conflicts."
        ]
    },
    "Focus": {
        "green": [
            "Mental clarity is peaking. Perfect for deep, uninterrupted work.",
            "Sharp problem-solving skills today. Tackle complex logic.",
            "Communication is flowing. Write that difficult email."
        ],
        "yellow": [
            "Standard focus levels. Break tasks into smaller chunks.",
            "Your mind might wander. Use a timer to stay on track.",
            "Good for brainstorming, but maybe not for final editing."
        ],
        "red": [
            "Brain fog is heavy today. Triple-check your work.",
            "Mercury is causing static. Avoid signing major contracts today.",
            "Distractions are high. Be gentle with your attention span."
        ]
    },
    "Rest": {
        "green": [
            "Deep recovery is possible tonight. Prioritize sleep.",
            "Your body is craving downtime. A perfect evening to do nothing.",
            "Excellent energy for meditation or a long bath."
        ],
        "yellow": [
            "Standard recovery day. Stick to your normal evening routine.",
            "Balance your output with equal amounts of downtime.",
            "Try to wind down an hour earlier than usual tonight."
        ],
        "red": [
            "You might feel restless or anxious tonight. Avoid caffeine late.",
            "Sleep might be interrupted. Try a digital detox before bed.",
            "Your mind is racing. Write down your thoughts to clear your head."
        ]
    }
}

def get_category_text(category, status):
    options = DAILY_TEXT[category][status]
    return random.choice(options)
