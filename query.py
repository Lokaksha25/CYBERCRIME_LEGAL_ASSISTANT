import chromadb
import json
import os
import sys
from chromadb.utils import embedding_functions

# --- CONFIGURATION ---
db_path = "./cyber_crime_db"  # Must match the path in ingest.py
collection_name = "cybercrime_rag"

def initialize_client():
    """Initializes the ChromaDB client and retrieves the collection."""
    print("--- System Status: Connecting to Vector Database ---")
    
    if not os.path.exists(db_path):
        print(f"Error: Database folder '{db_path}' not found. Please run ingest.py first.")
        sys.exit()

    try:
        client = chromadb.PersistentClient(path=db_path)
        default_ef = embedding_functions.DefaultEmbeddingFunction()
        
        # Check if collection exists
        try:
            collection = client.get_collection(name=collection_name, embedding_function=default_ef)
            print(f"Status: Successfully connected to collection '{collection_name}'.")
            print(f"Total documents in DB: {collection.count()}")
            print("System ready for queries.\n")
            return collection
        except ValueError:
            print(f"Error: Collection '{collection_name}' does not exist. Run ingest.py first.")
            sys.exit()
            
    except Exception as e:
        print(f"Critical Error: Could not connect to database. Details: {e}")
        sys.exit()

def search_crime_db(collection, question, n_results=3):
    """
    Searches the database for the most relevant records based on the user question.
    """
    print(f"Processing Query: '{question}'...")
    
    results = collection.query(
        query_texts=[question],
        n_results=n_results
    )
    
    # Check if we got results
    if not results['ids'] or not results['ids'][0]:
        print("No relevant results found.")
        return

    # Loop through results
    for i in range(len(results['ids'][0])):
        doc_id = results['ids'][0][i]
        metadata = results['metadatas'][0][i]
        document_text = results['documents'][0][i]
        distance = results['distances'][0][i] if 'distances' in results else "N/A"
        
        print("\n" + "="*60)
        print(f"RESULT #{i+1} | ID: {doc_id} | Relevance Score (lower=better): {distance:.4f}")
        print("="*60)
        
        # 1. Display Key Metadata Fields (using .get for safety)
        title = metadata.get('title', 'N/A')
        category = metadata.get('category', 'N/A')
        location = metadata.get('location', 'Unknown')
        year = metadata.get('year', 'Unknown')
        severity = metadata.get('seriousness_level', 'Unknown')
        
        print(f"Title:       {title}")
        print(f"Category:    {category}")
        print(f"Location:    {location} ({year})")
        print(f"Severity:    {severity}")
        
        # 2. Display the Laws (if available in metadata)
        laws = metadata.get('laws', None)
        if laws:
            print("-" * 20)
            print(f"LAWS CITED: {laws}")

        # 3. Display the Full Context
        print("-" * 20)
        print("FULL CONTEXT:")
        print(document_text.strip())

        # 4. Deserialize and Display 'Next Steps'
        print("-" * 20)
        print("RECOMMENDED ACTION PLAN:")
        
        raw_steps = metadata.get('next_steps', '[]')
        try:
            # We stored this as a JSON string in ingest.py, so we must load it back
            steps_list = json.loads(raw_steps)
            
            if isinstance(steps_list, list) and len(steps_list) > 0:
                for step in steps_list:
                    print(f"  [+] {step}")
            else:
                print("  (No specific steps provided in record)")
                
        except json.JSONDecodeError:
            print(f"  (Error parsing steps: {raw_steps})")
        except Exception as e:
            print(f"  (Error displaying steps: {e})")

    print("\n" + "="*60 + "\n")

# --- MAIN EXECUTION LOOP ---
if __name__ == "__main__":
    collection = initialize_client()
    
    while True:
        try:
            user_query = input("Enter your query (or type 'exit' to quit): ")
            if user_query.strip().lower() in ['exit', 'quit', 'q']:
                print("Terminating session.")
                break
            
            if user_query.strip():
                search_crime_db(collection, user_query)
        except KeyboardInterrupt:
            print("\nSession interrupted. Exiting.")
            break