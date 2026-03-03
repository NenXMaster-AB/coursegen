from __future__ import annotations
import datetime as dt
from dataclasses import dataclass


@dataclass
class SM2Result:
    ease_factor: float
    interval: int
    repetitions: int
    next_review: dt.datetime


def sm2(
    quality: int,
    ease_factor: float,
    interval: int,
    repetitions: int,
) -> SM2Result:
    """Pure SM-2 algorithm. quality: 0–5, returns updated scheduling state."""
    assert 0 <= quality <= 5

    if quality >= 3:
        if repetitions == 0:
            new_interval = 1
        elif repetitions == 1:
            new_interval = 6
        else:
            new_interval = round(interval * ease_factor)
        new_reps = repetitions + 1
    else:
        new_interval = 1
        new_reps = 0

    new_ef = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    new_ef = max(1.3, new_ef)

    next_review = dt.datetime.utcnow() + dt.timedelta(days=new_interval)

    return SM2Result(
        ease_factor=round(new_ef, 4),
        interval=new_interval,
        repetitions=new_reps,
        next_review=next_review,
    )
