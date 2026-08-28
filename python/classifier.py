import sys
import json
import argparse
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.tree import DecisionTreeClassifier

# ─── Simple Intent Classification Corpus ───
training_data = [
    # play_music
    ("play music", "play_music"),
    ("play some songs on spotify", "play_music"),
    ("resume spotify music", "play_music"),
    ("pause the track", "play_music"),
    ("stop playing", "play_music"),
    ("skip this song", "play_music"),
    ("next song please", "play_music"),
    ("previous track", "play_music"),
    ("what song is playing now", "play_music"),
    ("play blinding lights", "play_music"),
    ("put on bohemian rhapsody", "play_music"),
    
    # get_weather
    ("what is the weather like", "get_weather"),
    ("is it raining outside", "get_weather"),
    ("weather in London", "get_weather"),
    ("how cold is it today", "get_weather"),
    ("give me the temperature forecast", "get_weather"),
    ("weather update", "get_weather"),
    ("is it sunny in Delhi", "get_weather"),
    
    # open_app
    ("open youtube in browser", "open_app"),
    ("open google website", "open_app"),
    ("open my whatsapp desktop", "open_app"),
    ("launch whatsapp application", "open_app"),
    ("open gmail inbox", "open_app"),
    ("open instagram feed", "open_app"),
    ("open mail", "open_app"),
    
    # shutdown
    ("shut down systems", "shutdown"),
    ("shutdown neural interface", "shutdown"),
    ("goodbye jarvis", "shutdown"),
    ("bye bye", "shutdown"),
    ("stop interface", "shutdown"),
    
    # general_chat
    ("hello jarvis", "general_chat"),
    ("how are you doing today", "general_chat"),
    ("who built you", "general_chat"),
    ("tell me a joke", "general_chat"),
    ("what is quantum computing", "general_chat"),
    ("can you explain recursion", "general_chat"),
    ("who are you", "general_chat")
]

def train_and_predict(text):
    texts = [item[0] for item in training_data]
    labels = [item[1] for item in training_data]

    # Convert text to features
    vectorizer = TfidfVectorizer(lowercase=True, stop_words='english')
    x_train = vectorizer.fit_transform(texts)

    # Train a Decision Tree Classifier (classical ML)
    clf = DecisionTreeClassifier(random_state=42)
    clf.fit(x_train, labels)

    # Transform input text and predict
    x_test = vectorizer.transform([text])
    pred = clf.predict(x_test)[0]
    
    # Calculate simple confidence (distance representation)
    probs = clf.predict_proba(x_test)[0]
    classes = clf.classes_
    pred_idx = list(classes).index(pred)
    confidence = float(probs[pred_idx])

    return {"intent": pred, "confidence": round(confidence, 2)}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="J.A.R.V.I.S. Intent Classifier")
    parser.add_argument("--predict", type=str, required=True, help="Text to classify")
    args = parser.parse_args()

    try:
        res = train_and_predict(args.predict)
        print(json.dumps(res))
    except Exception as e:
        print(json.dumps({"intent": "general_chat", "confidence": 0.0, "error": str(e)}))
