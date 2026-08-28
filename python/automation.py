import sys
import os
import psutil
import pyautogui

def capture_screenshot(output_path='screenshot.png'):
    """Takes a system screenshot and saves it."""
    try:
        myScreenshot = pyautogui.screenshot()
        myScreenshot.save(output_path)
        print(f"Screenshot captured and saved to: {output_path}")
        return True
    except Exception as e:
        print(f"Screenshot failed: {e}", file=sys.stderr)
        return False

def get_system_processes():
    """Returns a list of top processes running on the machine sorted by memory."""
    processes = []
    for proc in psutil.process_iter(['pid', 'name', 'memory_percent']):
        try:
            processes.append(proc.info)
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    # Sort processes by memory percent descending
    processes = sorted(processes, key=lambda x: x['memory_percent'] or 0, reverse=True)
    return processes[:10]

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--screenshot':
        out = sys.argv[2] if len(sys.argv) > 2 else 'screenshot.png'
        capture_screenshot(out)
    else:
        print("System Processes Diagnostics:")
        for p in get_system_processes():
            print(f"PID: {p['pid']} | Name: {p['name']} | MEM: {p['memory_percent']:.2f}%")
