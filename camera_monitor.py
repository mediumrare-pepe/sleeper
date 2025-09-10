import cv2
import os
import time
import threading
from datetime import datetime
import requests

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:3000/api/sleep")
SLEEP_DURATION = float(os.environ.get("SLEEP_DURATION", 10))  # seconds of no motion to count as sleep
CAMERA_URLS = [url.strip() for url in os.environ.get("CAMERA_URLS", "").split(",") if url.strip()]


def post_event(camera_name: str, start_time: datetime, end_time: datetime | None):
    """Post sleep events to the backend API."""
    payload = {
        "camera": camera_name,
        "start_time": start_time.isoformat(),
        "end_time": end_time.isoformat() if end_time else None,
    }
    try:
        requests.post(BACKEND_URL, json=payload, timeout=5)
    except requests.RequestException as exc:
        print(f"Failed to post event for {camera_name}: {exc}")


def monitor_camera(url: str, name: str):
    cap = None
    prev_frame = None
    last_motion = time.time()
    sleeping = False
    sleep_start = None

    while True:
        # connect or reconnect to the camera
        if cap is None or not cap.isOpened():
            cap = cv2.VideoCapture(url)
            if not cap.isOpened():
                print(f"Unable to connect to {name}; retrying in 5s")
                time.sleep(5)
                continue

        # read a frame
        ok, frame = cap.read()
        if not ok:
            print(f"Lost connection to {name}; reconnecting")
            cap.release()
            cap = None
            time.sleep(5)
            continue

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (21, 21), 0)

        if prev_frame is None:
            prev_frame = gray
            continue

        delta = cv2.absdiff(prev_frame, gray)
        _, thresh = cv2.threshold(delta, 25, 255, cv2.THRESH_BINARY)
        motion = cv2.countNonZero(thresh)
        prev_frame = gray

        if motion > 500:
            last_motion = time.time()
            if sleeping:
                sleeping = False
                post_event(name, sleep_start, datetime.utcnow())
                sleep_start = None
        else:
            if not sleeping and time.time() - last_motion > SLEEP_DURATION:
                sleeping = True
                sleep_start = datetime.utcnow()
                post_event(name, sleep_start, None)

        time.sleep(0.1)


if __name__ == "__main__":
    if not CAMERA_URLS:
        raise SystemExit("No CAMERA_URLS provided")

    threads = []
    for idx, url in enumerate(CAMERA_URLS, start=1):
        name = f"camera{idx}"
        t = threading.Thread(target=monitor_camera, args=(url, name), daemon=True)
        t.start()
        threads.append(t)

    for t in threads:
        t.join()
