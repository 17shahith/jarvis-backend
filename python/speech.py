import os
import sys
import speech_recognition as sr
import pyttsx3

def speak(text):
    """Local TTS synthesis using pyttsx3."""
    print(f"J.A.R.V.I.S.: {text}")
    try:
        engine = pyttsx3.init()
        # Configure voice settings
        engine.setProperty('rate', 165)  # Speaking speed rate
        engine.setProperty('volume', 0.9)  # Volume levels
        
        # Select best voice
        voices = engine.getProperty('voices')
        selected_voice = voices[0].id
        for voice in voices:
            if "david" in voice.name.lower() or "zira" in voice.name.lower():
                selected_voice = voice.id
                break
        
        engine.setProperty('voice', selected_voice)
        engine.say(text)
        engine.runAndWait()
    except Exception as e:
        print(f"TTS synthesis error: {e}", file=sys.stderr)

def listen():
    """Local audio microphone speech recognition."""
    r = sr.Recognizer()
    with sr.Microphone() as source:
        print("Listening for audio input...")
        r.adjust_for_ambient_noise(source, duration=0.8)
        audio = r.listen(source)
    try:
        print("Processing transcription...")
        text = r.recognize_google(audio)
        print(f"User Transcribed: {text}")
        return text
    except sr.UnknownValueError:
        print("Google Speech Recognition could not understand audio.")
        return ""
    except sr.RequestError as e:
        print(f"Could not request results; {e}", file=sys.stderr)
        return ""

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--speak':
        speech_text = " ".join(sys.argv[2:]) if len(sys.argv) > 2 else "Sir, I am listening and ready."
        speak(speech_text)
    else:
        text = listen()
        if text:
            speak(f"You said: {text}")
