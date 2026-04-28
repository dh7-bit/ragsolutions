# 📄 RAG-Based Document Question Answering System

A Retrieval-Augmented Generation (RAG) based web application that allows users to upload PDF documents and ask questions using a chatbot interface. The system retrieves relevant context from documents using semantic search and generates accurate answers using embeddings and vector similarity.

---

## 🚀 Features

- Upload PDF documents
- Chat with uploaded documents using natural language queries
- Semantic search using embeddings
- Context-aware answers using RAG pipeline
- Vector storage and retrieval using ChromaDB
- Flask-based web interface

---

## 🧠 How It Works

PDF Upload → Text Extraction → Chunking → Embedding Generation → ChromaDB Storage → Query Embedding → Cosine Similarity Search → Response Generation

---

## 🛠️ Tech Stack

- Python  
- Flask  
- ChromaDB  
- NLP Embedding Models  
- Cosine Similarity  
- React

---

## 📌 System Workflow

1. User uploads a PDF file
2. Text is extracted from the PDF
3. Text is split into smaller chunks
4. Each chunk is converted into embeddings
5. Embeddings are stored in ChromaDB
6. User enters a question in chatbot
7. Query is converted into embedding
8. Similar chunks are retrieved using cosine similarity
9. Final answer is generated using retrieved context

---

## 🔍 Key Concepts

### Semantic Search
Instead of matching exact words, the system understands meaning using embeddings and retrieves contextually relevant results.

### Embeddings
Text is converted into numerical vectors that represent semantic meaning.

### Cosine Similarity
Used to measure similarity between query vector and document chunk vectors.

---

## 📂 Project Structure
