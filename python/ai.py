import os
import sys
from dotenv import load_dotenv

# Load root .env file (since Python scripts reside in backend/python/, we load ../../.env)
env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
load_dotenv(dotenv_path=env_path)

def query_ollama(prompt, model=None):
    """Hits local Ollama model directly using requests."""
    import requests
    import json
    
    host = os.environ.get('OLLAMA_HOST', 'http://localhost:11434')
    default_model = os.environ.get('QWEN_MODEL', 'qwen2.5:1.5b')
    model = model or default_model
    
    url = f"{host}/api/generate"
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False
    }
    
    try:
        response = requests.post(url, json=payload, timeout=15)
        response.raise_for_status()
        data = response.json()
        return data.get('response', '')
    except Exception as e:
        return f"Error connecting to Ollama: {str(e)}"

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python ai.py \"Your prompt text here\" [optional_model_name]")
        sys.exit(1)
        
    prompt_text = sys.argv[1]
    model_name = sys.argv[2] if len(sys.argv) > 2 else None
    
    print("Connecting to local neural core...")
    reply = query_ollama(prompt_text, model_name)
    print(f"\nResponse:\n{reply}")
