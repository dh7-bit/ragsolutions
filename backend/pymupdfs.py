from langchain_community.document_loaders import PyMuPDFLoader
import os

def load_pdf_documents(file_path):
    """
    Load PDF using LangChain PyMuPDFLoader
    Returns list of Document objects
    """

    loader = PyMuPDFLoader(file_path)
    documents = loader.load()

    return documents