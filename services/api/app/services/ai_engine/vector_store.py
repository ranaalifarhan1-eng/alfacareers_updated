import logging
import chromadb
from chromadb.config import Settings as ChromaSettings
from app.core.config import settings

logger = logging.getLogger("chromadb")


class VectorStoreClient:
    def __init__(self):
        self.client = None
        self.jobs_collection = None
        self.candidates_collection = None
        self._initialize()

    def _initialize(self):
        try:
            # Connect to ChromaDB server via HttpClient or PersistentClient fallback
            self.client = chromadb.HttpClient(
                host=settings.CHROMADB_HOST,
                port=settings.CHROMADB_PORT,
                settings=ChromaSettings(allow_reset=True, anonymized_telemetry=False)
            )
            logger.info(f"Connected to ChromaDB server at {settings.CHROMADB_HOST}:{settings.CHROMADB_PORT}")
        except Exception as e:
            logger.warning(f"Could not connect to ChromaDB HTTP server ({e}), initializing local persistent store.")
            self.client = chromadb.PersistentClient(path="./chroma_db")

        # Initialize collections
        self.jobs_collection = self.client.get_or_create_collection(
            name="jobs_vector_store",
            metadata={"hnsw:space": "cosine", "description": "Job description embeddings"}
        )
        self.candidates_collection = self.client.get_or_create_collection(
            name="candidates_vector_store",
            metadata={"hnsw:space": "cosine", "description": "Candidate profile embeddings"}
        )

    def get_jobs_collection(self):
        return self.jobs_collection

    def get_candidates_collection(self):
        return self.candidates_collection


vector_store = VectorStoreClient()
