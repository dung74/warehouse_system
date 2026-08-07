import os
from dotenv import load_dotenv


# Cập nhật import Ollama chuẩn xác (không bị DeprecationWarning)
from langchain_ollama import OllamaEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate

# Import các công cụ LCEL (LangChain Expression Language) chuẩn mới
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

load_dotenv()


class RagEngine:
    def __init__(self):
        self.rag_chain = None

    def initialize(self):
        print("Initializing RAG service...")

        embeddings = OllamaEmbeddings(
            model="qwen3-embedding:0.6b", 
            base_url="http://host.docker.internal:11434"
        )

        persist_dir = "./app/data/faiss_index"

        if not os.path.exists(persist_dir):
            raise FileNotFoundError(f"FAISS index not found at {persist_dir}. Please build the vector database first.")

        vector_db = FAISS.load_local(
            folder_path=persist_dir,
            embeddings=embeddings,
            allow_dangerous_deserialization=True  
        )

        retriver = vector_db.as_retriever(search_kwargs={"k": 3 })

        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0.2,
        )

        system_prompt = (
            "Bạn là trợ lý ảo hỗ trợ nhân viên của công ty về các nội quy và quy trình kho bãi. "
            "Hãy sử dụng các thông tin ngữ cảnh dưới đây để trả lời câu hỏi của người dùng. "
            "Nếu không biết, hãy nói 'Tôi không tìm thấy thông tin này trong quy định hiện tại'.\n\n"
            "NGỮ CẢNH:\n{context}"
        )

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "{input}")
        ])

        def format_docs(docs):
            return "\n\n".join([doc.page_content for doc in docs])


        self.rag_chain = (
            {"context": retriver | format_docs, "input": RunnablePassthrough() }

            | prompt

            | llm

            | StrOutputParser()
        )

        print("RAG service initialized successfully.")

    def get_answer(self, question: str):
        if not self.rag_chain:
            self.initialize()


        answer = self.rag_chain.invoke(question)
        return answer


rag_engine = RagEngine()