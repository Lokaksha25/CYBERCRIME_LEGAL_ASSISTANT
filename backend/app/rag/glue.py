import chromadb
from pathlib import Path
from chromadb.utils import embedding_functions
from app.rag.llm import generate_answer

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


def answer_question(question: str, n_results: int = 5):
    """
    Full RAG pipeline:
    1. Retrieve relevant documents
    2. Generate answer using LLM
    """
    results = collection.query(
        query_texts=[question],
        n_results=n_results
    )

    if not results or not results["ids"] or not results["ids"][0]:
        return "No relevant cases found for this query.", []

    retrieved_docs = []

    for i in range(len(results["ids"][0])):
        retrieved_docs.append({
            "document": results["documents"][0][i],
            "metadata": results["metadatas"][0][i],
        })

    answer, case_summaries = generate_answer(question, retrieved_docs)
    return answer, case_summaries
