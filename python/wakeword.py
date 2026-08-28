import os
import sys
import time
import speech_recognition as sr

def monitor_wakeword():
    """Listens continuously for the wake word using standard SpeechRecognition."""
    r = sr.Recognizer()
    wakeword = os.environ.get('WAKE_WORD', 'jarvis').lower()
    print(f"Starting wake word monitor... Listening for '{wakeword}'")
    
    with sr.Microphone() as source:
        r.adjust_for_ambient_noise(source, duration=1.0)
        
        while True:
            try:
                print("Monitoring ambient channel...")
                audio = r.listen(source, timeout=5, phrase_time_limit=3)
                print("Checking transcription...")
                text = r.recognize_google(audio).lower()
                
                if wakeword in text:
                    print(f"\n[WAKE WORD TRIGGERED] Detected '{wakeword}' in input: '{text}'")
                    # Here we could play an activation sound or call an API trigger
                    # To test: we print and exit
                    print("Sir, what can I do for you?")
                    break
            except sr.WaitTimeoutError:
                # Normal timeout when no sound is heard
                continue
            except sr.UnknownValueError:
                # Could not understand the voice
                continue
            except Exception as e:
                print(f"Error in monitor: {e}", file=sys.stderr)
                time.sleep(1)

if __name__ == '__main__':
    try:
        monitor_wakeword()
    except KeyboardInterrupt:
        print("\nWake word monitoring terminated.")
