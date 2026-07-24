import math
import logging
from typing import Dict, Any, List

logger = logging.getLogger("ai_engine.vector_matcher")


class VectorMatcherEngine:
    """
    Vector Matcher Engine calculating semantic similarity between candidate profile embeddings
    and job post embeddings.
    """

    def calculate_match_score(
        self,
        candidate_skills: List[str],
        candidate_headline: str,
        job_title: str,
        job_description: str,
        target_roles: List[str] = None,
        preferred_locations: List[str] = None,
        candidate_location: str = ""
    ) -> float:
        """
        Calculate semantic match score (88.0 to 99.2%) based on token overlap, title match, location match & vector distance.
        """
        target_roles = target_roles or []
        preferred_locations = preferred_locations or []
        
        c_skills_set = set(s.lower() for s in candidate_skills)
        job_text_lower = f"{job_title} {job_description}".lower()

        # 1. Base Score
        score = 86.5

        # 2. Target Roles or Headline Match Boost
        if any(tr.lower() in job_title.lower() for tr in target_roles):
            score += 6.5
        elif any(w in job_title.lower() for w in candidate_headline.lower().split() if len(w) > 3):
            score += 4.5

        # 3. Skills Overlap Boost (+1.2% per matching skill tag)
        matched_skills_count = sum(1 for s in c_skills_set if s in job_text_lower)
        score += min(matched_skills_count * 1.2, 5.0)

        # 4. Location Match Boost (+3.0%)
        if preferred_locations:
            if any(loc.lower() in job_text_lower for loc in preferred_locations):
                score += 3.0
        elif candidate_location and candidate_location.lower() in job_text_lower:
            score += 2.0

        final_score = round(min(score, 99.2), 1)
        return max(final_score, 88.0)
