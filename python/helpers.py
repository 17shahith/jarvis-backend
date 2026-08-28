import os
import logging
from dotenv import load_dotenv

# Load env variables
env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
load_dotenv(dotenv_path=env_path)

def setup_logging(name="JARVIS-PYTHON"):
    """Sets up standard logger format for Python scripts."""
    log_level_str = os.environ.get('LOG_LEVEL', 'INFO').upper()
    log_level = getattr(logging, log_level_str, logging.INFO)
    
    logger = logging.getLogger(name)
    logger.setLevel(log_level)
    
    if not logger.handlers:
        ch = logging.StreamHandler()
        ch.setLevel(log_level)
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        ch.setFormatter(formatter)
        logger.addHandler(ch)
        
    return logger

def get_env_var(key, default=None):
    """Safely retrieves environment variables."""
    return os.environ.get(key, default)
