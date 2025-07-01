from dataclasses import dataclass

@dataclass
class MatchData:
    date: str
    opponent: str
    venue: str
    competition: str
    goals_for: int
    goals_against: int
    result: str
    possession: float
    shots: int
    shots_on_target: int
    corners: int
    fouls: int
    cards: int
    xg: float
    opponent_xg: float
