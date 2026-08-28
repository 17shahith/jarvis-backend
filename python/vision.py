import sys
import cv2
import numpy as np

def run_vision_tracking():
    """Initializes OpenCV and runs face detection simulation/capture."""
    print("Initializing computer vision model...")
    # Load default OpenCV Haar Cascade face classifier
    cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    face_cascade = cv2.CascadeClassifier(cascade_path)
    
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Could not access camera device. Vision interface is inactive.", file=sys.stderr)
        return
        
    print("Camera feed active. Press 'q' to close camera window.")
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Error: Failed to grab video frame.", file=sys.stderr)
            break
            
        # Convert frame to grayscale for cascade classifier
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
        
        # Draw target rectangles around faces
        for (x, y, w, h) in faces:
            # Sci-fi green crosshair/target rect
            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
            cv2.putText(frame, "USER LOCKED", (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
            
        cv2.imshow('J.A.R.V.I.S. Neural Vision System', frame)
        
        # Break key capture
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
            
    cap.release()
    cv2.destroyAllWindows()
    print("Camera interface closed.")

if __name__ == '__main__':
    run_vision_tracking()
