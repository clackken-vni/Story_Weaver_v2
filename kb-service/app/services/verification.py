import asyncio
from typing import Tuple
from app.services.search_providers import SearchProviders


class VerificationService:
    def __init__(self):
        self.search = SearchProviders()
        self.trust_threshold = 0.9

    async def verify(self, content: str, title: str) -> Tuple[bool, float]:
        claims = self._extract_claims(content)

        if not claims:
            return False, 0.0

        verification_scores = []
        for claim in claims[:3]:
            results = await self.search.search_all(claim, num_results=5)
            score = self._calculate_trust_score(claim, results)
            verification_scores.append(score)

        avg_score = sum(verification_scores) / len(verification_scores) if verification_scores else 0.0

        return avg_score >= self.trust_threshold, avg_score

    def _extract_claims(self, content: str) -> list:
        sentences = content.split('. ')
        claims = [s.strip() for s in sentences if len(s.strip()) > 20]
        return claims[:5]

    def _calculate_trust_score(self, claim: str, search_results: list) -> float:
        if not search_results:
            return 0.0

        claim_words = set(claim.lower().split())
        matches = 0

        for result in search_results:
            result_text = f"{result.get('title', '')} {result.get('snippet', '')}".lower()
            matching_words = sum(1 for word in claim_words if word in result_text)
            if matching_words >= len(claim_words) * 0.3:
                matches += 1

        return min(matches / len(search_results), 1.0)
