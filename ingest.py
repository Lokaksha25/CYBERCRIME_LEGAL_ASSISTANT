import json
import chromadb
import os
import sys
from chromadb.utils import embedding_functions

# --- CONFIGURATION ---
filename = 'data/cases.json'
db_path = "./cyber_crime_db"

print("--- STEP 1: STARTING ---")

# 1. Check if file exists
if not os.path.exists(filename):
    print(f" ERROR: The file '{filename}' was not found.")
    sys.exit()

# 2. Load JSON
try:
    with open(filename, 'r', encoding='utf-8') as f:
        data = json.load(f)
    print("JSON loaded successfully.")
except Exception as e:
    print(f" ERROR reading JSON file: {e}")
    sys.exit()

# --- FIX: FLATTEN THE DATA ---
# Your JSON groups cases by keys (e.g., "account_hacking_cases", "cyber_bullying_cases").
# We must gather them into a single list to ingest them.
all_cases = []

if isinstance(data, dict):
    for category, cases_list in data.items():
        if isinstance(cases_list, list):
            print(f" - Found {len(cases_list)} cases in category: {category}")
            all_cases.extend(cases_list)
elif isinstance(data, list):
    all_cases = data
else:
    print("Error: JSON structure not recognized (expected dict or list).")
    sys.exit()

print(f"Total records to process: {len(all_cases)}")

# 3. Initialize ChromaDB
print("Initializing ChromaDB...")
client = chromadb.PersistentClient(path=db_path)

# 4. Setup Embedding Function
print("Setting up Embedding Function...")
default_ef = embedding_functions.DefaultEmbeddingFunction()

# 5. Clean Slate 
print(" Preparing database...")
try:
    # Delete old collection to prevent ID conflicts or stale data
    client.delete_collection(name="cybercrime_rag")
    print("   (Deleted old collection to ensure fresh data)")
except Exception:
    print("   (No existing collection found, creating new one)")

collection = client.get_or_create_collection(
    name="cybercrime_rag",
    embedding_function=default_ef
)

# 6. Process Data
ids = []
documents = []
metadatas = []

print(" Processing records...")

for index, item in enumerate(all_cases):
    # Skip items that don't have the expected structure
    if not isinstance(item, dict) or not item.get('metadatas'):
        print(f"Skipping record {index}: Invalid format.")
        continue

    try:
        # Extract fields based on your specific JSON schema
        record_id = item['ids'][0]
        raw_meta = item['metadatas'][0]
        incident_doc = item['documents'][0]
        
        # Prepare text for embedding (combine title, desc, laws, etc.)
        laws_involved = raw_meta.get('laws_involved', [])
        # Handle laws if it's a list of dicts or just a string
        if isinstance(laws_involved, list):
            laws_text = "; ".join([str(law.get('section', '')) for law in laws_involved if isinstance(law, dict)])
        else:
            laws_text = str(laws_involved)

        composite_text = (
            f"Incident: {raw_meta.get('title', 'Unknown')}\n"
            f"Category: {raw_meta.get('category', 'Unknown')}\n"
            f"Description: {incident_doc}\n"
            f"Location: {raw_meta.get('location', 'Unknown')} ({raw_meta.get('year', 'Unknown')})\n"
            f"Laws Involved: {laws_text}\n"
            f"Severity: {raw_meta.get('seriousness_level', 'Unknown')}"
        )
        
        # Prepare Metadata (ChromaDB requires flat simple types: str, int, float)
        # Complex lists (like 'next_steps') must be converted to JSON strings.
        clean_metadata = {
            "title": raw_meta.get('title', ''),
            "category": raw_meta.get('category', ''),
            "subcategory": raw_meta.get('subcategory', ''),
            "seriousness_level": raw_meta.get('seriousness_level', ''),
            "location": raw_meta.get('location', 'Unknown'),
            "year": int(raw_meta.get('year', 0)),
            # Convert list to string for storage
            "next_steps": json.dumps(raw_meta.get('next_steps_user_should_take', [])),
            "laws": laws_text
        }

        ids.append(record_id)
        documents.append(composite_text)
        metadatas.append(clean_metadata)

    except KeyError as e:
        print(f" - Error in record {index}: Missing key {e}")
    except Exception as e:
        print(f" - Unexpected error in record {index}: {e}")

# 7. Ingest into ChromaDB
if ids:
    print(f"Adding {len(ids)} records to ChromaDB...")
    collection.add(
        ids=ids,
        documents=documents,
        metadatas=metadatas
    )
    print(f"--- SUCCESS: {len(ids)} records ingested successfully! ---")
else:
    print("--- WARNING: No valid records found to ingest. ---")