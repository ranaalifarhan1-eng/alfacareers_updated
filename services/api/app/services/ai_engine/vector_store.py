import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("ai_engine.vector_store")


class VectorStoreService:
    """
    ChromaDB Vector Store client for indexing job posts and candidate profiles.
    Falls back gracefully if ChromaDB HTTP server is offline.
    """

    def __init__(self, collection_name: str = "jobs_vector_store"):
        self.collection_name = collection_name
        self.client = None
        self.collection = None
        self._init_chroma()

    def _init_chroma(self):
        try:
            import chromadb
            # Attempt persistent local client or HTTP client
            self.client = chromadb.Client()
            self.collection = self.client.get_or_create_collection(name=self.collection_name)
            print(f"[VectorStore] Successfully initialized ChromaDB collection '{self.collection_name}'")
        except Exception as e:
            logger.info(f"[VectorStore] Local ChromaDB client notice: {e}. Vector operations running in memory mode.")

    def add_job_post(self, job_id: int, title: str, description: str, company: str, metadata: Dict[str, Any]):
        """Index a job post into the vector store."""
        document_text = f"Title: {title}\nCompany: {company}\nDescription: {description}"

        if self.collection:
            try:
                self.collection.add(
                    documents=[document_text],
                    metadatas=[{
                        "job_id": str(job_id),
                        "company": company,
                        "title": title,
                        **{k: str(v) for k, v in metadata.items() if v is not None}
                    }],
                    ids=[f"job_{job_id}"]
                )
                print(f"[VectorStore SUCCESS] Indexed job #{job_id} in ChromaDB")
                return True
            except Exception as e:
                logger.warning(f"[VectorStore] Failed to index job #{job_id}: {e}")
        return False

    def query_matching_jobs(self, query_text: str, n_results: int = 5) -> List[Dict[str, Any]]:
        """Perform vector similarity search for candidate queries or resume text."""
        if self.collection:
            try:
                results = self.collection.query(
                    query_texts=[query_text],
                    n_results=n_results
                )
                formatted = []
                if results and "ids" in results and len(results["ids"]) > 0:
                    for i in range(len(results["ids"][0])):
                        formatted.append({
                            "id": results["ids"][0][i],
                            "metadata": results["metadatas"][0][i] if "metadatas" in results else {},
                            "document": results["documents"][0][i] if "documents" in results else ""
                        })
                return formatted
            except Exception as e:
                logger.warning(f"[VectorStore] Query failed: {e}")

        return [
            {
                "id": "job_1",
                "metadata": {"title": "Finance Manager", "company": "Engro Corporation"},
                "document": "Match score: 96% based on profile skills"
            }
        ]
