import os
import httpx
import logging
from typing import List, Dict, Any
from app.core.config import settings

logger = logging.getLogger("deep_web_hunter.query_builder")


class DeepWebQueryBuilder:
    """
    Query builder and search client targeting un-syndicated corporate career pages.
    Supports SerpAPI, Bing Search API, and realistic mock fallback data.
    """

    TARGET_DOMAINS = [
        {"name": "Engro Corporation", "domain": "engro.com/careers", "country": "Pakistan"},
        {"name": "Careem Technologies", "domain": "careem.com/jobs", "country": "UAE"},
        {"name": "Systems Limited", "domain": "systemsltd.com/careers", "country": "Pakistan"},
        {"name": "Jazz Telecom", "domain": "jazz.com.pk/careers", "country": "Pakistan"},
        {"name": "Emirates Group", "domain": "emiratesgroupcareers.com", "country": "UAE"},
    ]

    def build_query(self, domain: str, keyword: str = "") -> str:
        """Construct targeted Google/Bing search operator string."""
        clean_domain = domain.replace("https://", "").replace("http://", "").rstrip("/")
        if keyword:
            return f'site:{clean_domain} "{keyword}"'
        return f'site:{clean_domain}'

    async def search_career_pages(self, query: str, num_results: int = 5) -> List[Dict[str, Any]]:
        """
        Execute live search via SerpAPI or Bing. Fallback to mock search results if API keys are absent.
        """
        serp_api_key = getattr(settings, "SERPAPI_KEY", None) or os.getenv("SERPAPI_KEY")

        if serp_api_key:
            try:
                print(f"[DeepWebHunter] Executing SerpAPI query: {query}")
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.get(
                        "https://serpapi.com/search",
                        params={
                            "q": query,
                            "api_key": serp_api_key,
                            "engine": "google",
                            "num": num_results
                        }
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        organic = data.get("organic_results", [])
                        results = []
                        for item in organic[:num_results]:
                            results.append({
                                "title": item.get("title", ""),
                                "url": item.get("link", ""),
                                "snippet": item.get("snippet", ""),
                                "source": "serpapi"
                            })
                        if results:
                            return results
            except Exception as e:
                logger.warning(f"[DeepWebHunter] SerpAPI search failed: {e}. Falling back to mock engine.")

        # --- Graceful Mock Fallback for Local Dev / Offline Testing ---
        print(f"[DeepWebHunter] Generating realistic dev search results for query: {query}")
        return [
            {
                "title": "Finance Manager - Engro Corporation Careers",
                "url": "https://www.engro.com/careers/finance-manager-lahore",
                "snippet": "Engro Corporation is seeking an experienced Finance Manager in Lahore. Responsibilities include financial modeling, budgeting, financial reporting, and SAP ERP management. Direct email: jobs@engro.com",
                "source": "mock_engine"
            },
            {
                "title": "Senior Operations Lead - Careem Careers",
                "url": "https://www.careem.com/jobs/senior-operations-lead-dubai",
                "snippet": "Join Careem in Dubai as Senior Operations Lead. Oversee logistics, driver performance, and data analytics. Direct application: recruitment@careem.com",
                "source": "mock_engine"
            },
            {
                "title": "Lead Software Engineer (Python/FastAPI) - Systems Ltd",
                "url": "https://www.systemsltd.com/careers/lead-python-engineer",
                "snippet": "Systems Limited is hiring a Lead Software Engineer in Lahore/Karachi. Require 5+ years experience in Python, FastAPI, Docker, and PostgreSQL. Contact: careers@systemsltd.com",
                "source": "mock_engine"
            }
        ][:num_results]
