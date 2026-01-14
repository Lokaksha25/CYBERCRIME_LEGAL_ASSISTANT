import chromadb
from pathlib import Path
from chromadb.utils import embedding_functions

# --- CONFIG ---
PROJECT_ROOT = Path(__file__).resolve().parents[3]
DB_PATH = PROJECT_ROOT / "cyber_crime_db"
COLLECTION_NAME = "cybercrime_rag"

# --- INIT ONCE ---
client = chromadb.PersistentClient(path=str(DB_PATH))

embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"
)

collection = client.get_collection(
    name=COLLECTION_NAME,
    embedding_function=embedding_fn
)


def retrieve_documents(query: str, top_k: int = 5):
    """
    Retrieve top-k relevant documents from ChromaDB.
    Returns list of dicts compatible with llm.generate_answer().
    """
    results = collection.query(
        query_texts=[query],
        n_results=top_k
    )

    if not results or not results["documents"]:
        return []

    retrieved = []

    for i in range(len(results["documents"][0])):
        retrieved.append({
            "id": results["ids"][0][i],
            "document": results["documents"][0][i],
            "metadata": results["metadatas"][0][i],
            "distance": (
                results["distances"][0][i]
                if "distances" in results else None
            )
        })

    return retrieved
