import chromadb
import numpy as np
import pandas as pd
import plotly.express as px
from sklearn.manifold import TSNE
from pathlib import Path

# --- CONFIG ---
DB_PATH = Path("./cyber_crime_db")
COLLECTION_NAME = "cybercrime_rag"

# --- CONNECT ---
client = chromadb.PersistentClient(path=str(DB_PATH))
collection = client.get_collection(name=COLLECTION_NAME)

# --- FETCH DATA ---
data = collection.get(include=['embeddings', 'metadatas', 'documents'])
embeddings = np.array(data['embeddings'])
metadatas = data['metadatas']
documents = data['documents']

if len(embeddings) < 3:
    print("Not enough data points for 3D t-SNE (need at least 3).")
    exit()

print(f"Generating 3D plot for {len(embeddings)} documents...")

# --- 3D T-SNE ---
# n_components=3 gives us X, Y, and Z
tsne = TSNE(n_components=3, random_state=42, perplexity=min(30, len(embeddings)-1))
vectors_3d = tsne.fit_transform(embeddings)

# --- PREPARE DATA FOR PLOTTING ---
labels = []
descriptions = []

for i, meta in enumerate(metadatas):
    # Try to find a good label
    label = meta.get('subcategory', meta.get('category', 'Unknown'))
    labels.append(label)
    
    # Create a nice hover text (Snippet of the document)
    # We take the first 100 chars of the document so the tooltip isn't huge
    doc_snippet = documents[i][:150] + "..." if len(documents[i]) > 150 else documents[i]
    descriptions.append(f"<b>{label}</b><br>{doc_snippet}")

df_3d = pd.DataFrame({
    'x': vectors_3d[:, 0],
    'y': vectors_3d[:, 1],
    'z': vectors_3d[:, 2],
    'label': labels,
    'desc': descriptions
})

# --- VISUALIZE WITH PLOTLY ---
fig = px.scatter_3d(
    df_3d,
    x='x', y='y', z='z',
    color='label',
    hover_name='label',
    hover_data={'desc': True, 'x': False, 'y': False, 'z': False, 'label': False},
    title=f"3D Legal Case Clusters: {COLLECTION_NAME}",
    opacity=0.7,
    size_max=10
)

# Make it look "cool" (Dark template, smaller dots)
fig.update_layout(template="plotly_dark")
fig.update_traces(marker=dict(size=5), customdata=df_3d['desc'], hovertemplate="%{customdata}")

fig.show()