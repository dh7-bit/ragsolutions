from langchain_text_splitters import RecursiveCharacterTextSplitter
def split_documents(documents,chunk_size=500,chunk_overlap=200):
    text_splitter=RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        separators=['\n\n','\n',' ','']

    )
    split_docs=text_splitter.split_documents(documents)
    print(f'split {len(documents)} documents into {len(split_docs)} chunks')
    print(split_docs)
    return split_docs