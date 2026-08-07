import os
from langchain_community.document_loaders import PyPDFDirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import OllamaEmbeddings

current_dir = os.path.dirname(os.path.abspath(__file__))
data_dir = os.path.join(current_dir, "app", "data")
save_path = os.path.join(current_dir, "app","data",  "faiss_index")
def build_vector_db():
    print("1. Loading PDF documents...")
    loader = PyPDFDirectoryLoader(data_dir)
    documents = loader.load()

    print(f"loaded {len(documents)} documents.")

    print("2. Splitting documents into chunks...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=600,
        chunk_overlap=100,
    )
    splits = text_splitter.split_documents(documents)
    print(f"split into {len(splits)} chunks.")

    print("3. Creating vector database...")
    embeddings = OllamaEmbeddings(
        model="qwen3-embedding:0.6b", 
        base_url="http://localhost:11434"
    )
    vector_db = FAISS.from_documents(splits, embeddings)

    
    vector_db.save_local(save_path)
    print(f"Vector database saved to {save_path}.")

if __name__ == "__main__":
    build_vector_db()
