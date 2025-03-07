from fastapi import FastAPI
from pydantic import BaseModel
from langchain_community.chat_models import ChatOpenAI
from langchain.prompts import ChatPromptTemplate

# Initialize FastAPI
app = FastAPI()

# OpenRouter API Key (Replace with your actual API Key)
API_KEY = "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"

# Initialize OpenRouter Chat Model
llm = ChatOpenAI(
    openai_api_key=API_KEY,
    openai_api_base="https://openrouter.ai/api/v1",
    model_name="deepseek/deepseek-chat:free"
)

# Define request model
class FactCheckRequest(BaseModel):
    text: str

# API Route for Fact Checking
@app.post("/fact-check")
async def fact_check(request: FactCheckRequest):
    template = """You are a professional investigator for fake news.
    Decide whether the following news (delimited by triple backticks) is fake or not.
    Provide sources if available.
    text: '''{text}'''"""

    chat_template = ChatPromptTemplate.from_template(template)
    user_messages = chat_template.format_messages(text=request.text)

    # Get AI response
    response = llm(user_messages)
    
    return {"result": response.content}
