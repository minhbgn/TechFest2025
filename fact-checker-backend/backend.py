from fastapi import FastAPI
from pydantic import BaseModel
from langchain_community.chat_models import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
import re
import json

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
    template = """You are a professional investigator for fake news. You have to decide whether the following news\
        delimited by the triple backticks is fake or not. Your response should be a pure json string with 3 field: fake-likeliness:\
        likeliness of the news being fake, using numbers 1 to 5 indicating: Not likely, less likely, maybe, more likely, most likely; \
        reason: the reason why you think the news is fake or not; \
        and source: provide the links to the websites you found the evidence the news is fake. \
        your response should only contain the content of the json string, including the open and closing brackets and nothing else. \
        text: '''{text}'''"""

    chat_template = ChatPromptTemplate.from_template(template)
    user_messages = chat_template.format_messages(text=request.text)

    # Get AI response
    response = llm(user_messages)
    content = response.content

    # Clean the string: remove markdown and json prefix
    cleaned_string = re.sub(r'^\s*```json\s*', '', content)  # Remove `json` and code block start
    cleaned_string = re.sub(r'\s*```\s*$', '', cleaned_string)  # Remove code block end

    # Convert JSON string to Python dictionary
    data = json.loads(cleaned_string)

    
    return data
