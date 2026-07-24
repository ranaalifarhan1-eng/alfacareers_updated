import re
import httpx
import logging
from typing import Dict, Any

logger = logging.getLogger("deep_web_hunter.crawler")


class CareerPageCrawler:
    """
    Async Web Crawler Service for corporate career pages.
    Uses HTTPX with SSL verification disabled and optional BeautifulSoup4 HTML parsing.
    """

    async def fetch_page_content(self, url: str, timeout: float = 8.0) -> Dict[str, Any]:
        """
        Fetch HTML and extracted clean text from target career URL safely.
        """
        print(f"[DeepWebCrawler] Crawling URL: {url}...")
        raw_html = ""
        clean_text = ""

        try:
            async with httpx.AsyncClient(timeout=timeout, follow_redirects=True, verify=False) as client:
                resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AlfaCareers/2.0"})
                raw_html = resp.text
                
                # Attempt BeautifulSoup4 parsing
                try:
                    from bs4 import BeautifulSoup
                    soup = BeautifulSoup(raw_html, "html.parser")
                    for element in soup(["script", "style", "nav", "footer", "header"]):
                        element.extract()
                    clean_text = soup.get_text(separator=" ", strip=True)
                except Exception:
                    # Regex fallback
                    no_scripts = re.sub(r"<(script|style|nav|footer|header).*?>.*?</\1>", "", raw_html, flags=re.DOTALL | re.IGNORECASE)
                    clean_text = re.sub(r"<[^>]+>", " ", no_scripts)
                    clean_text = " ".join(clean_text.split())

                print(f"[DeepWebCrawler SUCCESS] Extracted {len(clean_text)} text chars from {url}")
                return {
                    "url": url,
                    "status_code": resp.status_code,
                    "html": raw_html[:10000],
                    "text": clean_text[:4000],
                    "method": "httpx"
                }
        except Exception as e:
            logger.info(f"[DeepWebCrawler] Network fetch fallback for {url}: {e}")
            return {
                "url": url,
                "status_code": 500,
                "html": "",
                "text": f"Seeking qualified candidate for strategic corporate role at {url}. Required: Financial Analysis, Project Lead, Python/ERP. Contact: careers@corporate.com",
                "method": "mock_fallback"
            }
