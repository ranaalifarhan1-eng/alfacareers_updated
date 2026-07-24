import os
import httpx
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("deep_web_hunter.query_builder")


class DeepWebQueryBuilder:
    """
    Intuitive Query builder and search client targeting un-syndicated corporate career pages.
    Supports SerpAPI, Bing Search API, and realistic mock fallback data.
    """

    def build_search_query(
        self,
        keyword: str,
        location: Optional[str] = None,
        company: Optional[str] = None
    ) -> str:
        """
        Construct targeted Google/Bing search operator query string.
        - If company provided: site:{company}/careers "{keyword}" "{location}"
        - If company blank: inurl:careers OR inurl:jobs "{keyword}" "{location}" -site:linkedin.com -site:indeed.com -site:glassdoor.com
        """
        loc_part = f' "{location.strip()}"' if location and location.strip() else ""
        kw_part = f'"{keyword.strip()}"' if keyword and keyword.strip() else '"Careers"'

        if company and company.strip():
            clean_company = company.strip().replace("https://", "").replace("http://", "").rstrip("/")
            if "." not in clean_company:
                clean_company = f"{clean_company.lower().replace(' ', '')}.com/careers"
            elif "/careers" not in clean_company and "/jobs" not in clean_company:
                clean_company = f"{clean_company}/careers"
            
            query = f'site:{clean_company} {kw_part}{loc_part}'
        else:
            query = f'(inurl:careers OR inurl:jobs) {kw_part}{loc_part} -site:linkedin.com -site:indeed.com -site:glassdoor.com'

        print(f"[DeepWebQueryBuilder] Formatted Search Operator Query: {query}")
        return query

    async def search_career_pages(
        self,
        query: str,
        num_results: int = 3,
        keyword: str = "",
        location: str = "",
        company: str = ""
    ) -> List[Dict[str, Any]]:
        """
        Execute live search via SerpAPI or Bing. Fallback to mock search results if API keys are absent.
        """
        serp_api_key = getattr(os, "getenv")("SERPAPI_KEY", None)

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
        print(f"[DeepWebHunter] Generating dev search results for query: {query}")
        
        target_title = keyword.title() if keyword else "Senior Specialist"
        target_loc = location.title() if location else "Lahore, Pakistan"
        target_company = company.title() if company else "Engro Corporation"

        return [
            {
                "title": f"{target_title} - {target_company} Careers",
                "url": f"https://www.{target_company.lower().replace(' ', '')}.com/careers/{target_title.lower().replace(' ', '-')}",
                "snippet": f"{target_company} is seeking an experienced {target_title} in {target_loc}. Responsibilities include project leadership, strategic deliverables, and team management. Direct HR Email: jobs@{target_company.lower().replace(' ', '')}.com",
                "source": "mock_engine"
            },
            {
                "title": f"Lead {target_title} - Careem Technologies",
                "url": "https://www.careem.com/jobs/senior-lead-dubai",
                "snippet": f"Join Careem in Dubai/Hybrid as {target_title}. Oversee operations, driver performance, and technical strategy. Contact: recruitment@careem.com",
                "source": "mock_engine"
            },
            {
                "title": f"Senior {target_title} - Systems Limited",
                "url": "https://www.systemsltd.com/careers/senior-lead-lahore",
                "snippet": f"Systems Limited is hiring a Senior {target_title} in {target_loc}. Require 4+ years experience in Python, FastAPI, and Cloud Architecture. Contact: careers@systemsltd.com",
                "source": "mock_engine"
            }
        ][:num_results]
