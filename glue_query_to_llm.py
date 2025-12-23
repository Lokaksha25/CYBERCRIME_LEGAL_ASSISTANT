import chromadb
from chromadb.utils import embedding_functions
from llm import generate_answer

DB_PATH = "./cyber_crime_db"
COLLECTION_NAME = "cybercrime_rag"


def get_collection():
    client = chromadb.PersistentClient(path=DB_PATH)
    ef = embedding_functions.DefaultEmbeddingFunction()
    return client.get_collection(
        name=COLLECTION_NAME,
        embedding_function=ef
    )


def answer_question(question, n_results=3):
    collection = get_collection()

    results = collection.query(
        query_texts=[question],
        n_results=n_results
    )

    if not results["ids"] or not results["ids"][0]:
        return "No relevant cases found.", []

    retrieved_docs = []
    for i in range(len(results["ids"][0])):
        retrieved_docs.append({
            "document": results["documents"][0][i],
            "metadata": results["metadatas"][0][i],
        })

    
    answer, case_summaries = generate_answer(question, retrieved_docs)
    return answer, case_summaries

