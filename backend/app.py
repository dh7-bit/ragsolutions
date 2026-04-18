from flask import Flask, jsonify, request
import json
from flask_cors import CORS
import os
from flask import Response
import threading
from pymupdfs import load_pdf_documents
from chunks import split_documents
from embeddingmanager import EmbeddingManager
from vectorstore import VectorStore
import time
from groq import groq_chat
app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

EmbeddingManagers = EmbeddingManager()
VectorStores = VectorStore()

# ------------------ Upload Route ------------------

@app.route("/upload", methods=["POST"])
def upload():

    file = request.files.get("file")
    session_id = request.form.get('session_id')

    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    def generate():

        yield f"data: {json.dumps({'status': 'file saved', 'progress': 10})}\n\n"

        documents = load_pdf_documents(file_path)

        if not documents:
            yield f"data: {json.dumps({'error': 'PDF has no readable content'})}\n\n"
            return

        yield f"data: {json.dumps({'status': 'chunking document', 'progress': 30})}\n\n"

        split_document = split_documents(documents)

        if not split_document:
            yield f"data: {json.dumps({'error': 'No text chunks extracted'})}\n\n"
            return

        yield f"data: {json.dumps({'status': 'generating embeddings', 'progress': 60})}\n\n"

        texts = [doc.page_content for doc in split_document]
        embeddings = EmbeddingManagers.generate_embeddings(texts)

        yield f"data: {json.dumps({'status': 'storing in vector DB', 'progress': 85})}\n\n"

        VectorStores.add_documents(session_id, split_document, embeddings)

        yield f"data: {json.dumps({'status': 'finalizing', 'progress': 95})}\n\n"

        try:
            os.remove(file_path)
        except:
            pass

        result = [
            {
                "text": doc.page_content,
                "page": doc.metadata.get("page", None)
            }
            for doc in split_document
        ]

        yield f"data: {json.dumps({
            'status': 'done',
            'progress': 100,
            'message': 'PDF processed successfully',
            'documents': result
        })}\n\n"

    return Response(
        generate(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive"
        }
    )


# ------------------ SEARCH ROUTE (NEW) ------------------
@app.route("/search", methods=["POST"])
def search():
    data = request.get_json()

    query = data.get("query")
    session_id = data.get("session_id")

    if not query or not session_id:
        return jsonify({"error": "query and session_id required"}), 400

    # ----------------------------
    # 1. Expand query (better retrieval)
    # ----------------------------
    query_expanded = f"Explain in detail: {query}"
    query_embedding = EmbeddingManagers.generate_embeddings([query_expanded])[0]

    # ----------------------------
    # 2. Retrieve
    # ----------------------------
    results = VectorStores.collection.query(
        query_embeddings=[query_embedding],
        n_results=5,
        where={"session_id": session_id},
        include=["documents", "distances"]
    )

    documents = results["documents"][0]
    distances = results["distances"][0]

    # ----------------------------
    # 3. Convert to similarity
    # ----------------------------
    similarities = [1 - d for d in distances]
    print("Distances:", distances)
    print("Similarities:", similarities)
    context=" ".join(documents)
    mode="rag_strict"
    if mode == "rag_strict":
        prompt = f"""
there is context that i am providing you and please answer and summarise 
the answer by seeing user query what user want and then check in context  and then
provide answer by using context

Context:
{context}

Question:
{query}

Answer:
""" 
        final_answer=groq_chat(prompt)
    return jsonify({
        "query": query,
        "session_id": session_id,
        "answer": final_answer,
        "method": mode,
        "similarities": similarities
    })
def cleanup_loop(vector_store, interval=300):  # 300 sec = 5 min
    print('hello')
    while True:
        try:
            vector_store.cleanup_expired_documents(expiry_seconds=1800)
        except Exception as e:
            print("[CLEANUP ERROR]", e)

        time.sleep(interval)
# ------------------ RUN ------------------
if __name__ == "__main__":
    thread = threading.Thread(
        target=cleanup_loop,
        args=(VectorStores,),
        daemon=True
    )
    thread.start()
    app.run(debug=True, host="0.0.0.0", port=5000)