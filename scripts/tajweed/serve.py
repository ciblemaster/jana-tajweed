"""Voice feedback service: where each letter of a verse is heard in a child's recording (tier 2 of the plan).

The Node server sends one verse's letters and the child's recording; this answers with where the MMS aligner heard
each letter and how sure it is. The recording is decoded by ffmpeg through pipes and never written to disk; nothing is
kept once the answer is sent.

    uv venv --python 3.11 .venv && uv pip install --python .venv/bin/python torch==2.5.1 torchaudio==2.5.1 numpy
    .venv/bin/python scripts/tajweed/serve.py            # listens on 127.0.0.1:8790; SPEECH_PORT to change

The model (1.2 GB) is downloaded on the first start. ffmpeg must be installed.

POST /align  {"letters": [{"text": "قُ", "rule": null, "word": 0}, ...], "audio": "<base64 of the recording>"}
  → {"heard": [{"startMs": 120, "endMs": 260, "score": 0.81} or null for each letter], "durationMs": 3400}
GET /health  → {"ok": true}
"""
import base64
import json
import os
import subprocess
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from sounds import said

RATE = 16000
# A verse a child recites alone: long enough for the longest verse of Juz Amma, slowly.
MAX_SECONDS = 60
MAX_BODY = 4 * 1024 * 1024


def flatten(letters):
    """The letters as said() reads them, with what each sounds like."""
    flat = [{'text': l['text'], 'rule': l.get('rule'), 'word': l.get('word', 0)} for l in letters]
    for i, letter in enumerate(flat):
        sounds = said(flat, i)
        # The two lams of the name of Allah: the first shares the sound of the second.
        if letter['rule'] is None and len(letter['text']) == 1 and i + 1 < len(flat) and flat[i + 1]['text'][0] == letter['text']:
            sounds = ''
        letter['said'] = sounds
    return flat


def decode(audio_bytes):
    """Any recording a browser makes (webm, ogg, mp4) as 16 kHz mono samples, through pipes only."""
    out = subprocess.run(
        ['ffmpeg', '-v', 'error', '-i', 'pipe:0', '-t', str(MAX_SECONDS), '-ac', '1', '-ar', str(RATE), '-f', 'f32le', 'pipe:1'],
        input=audio_bytes, capture_output=True, check=True, timeout=30,
    )
    return out.stdout


class Aligner:
    def __init__(self):
        import torch
        import torchaudio

        self.torch, self.F = torch, torchaudio.functional
        bundle = torchaudio.pipelines.MMS_FA
        self.model = bundle.get_model(with_star=False)
        self.model.eval()
        self.dictionary = bundle.get_dict(star=None)
        self.lock = threading.Lock()

    def align(self, letters, audio_bytes):
        torch = self.torch
        flat = flatten(letters)
        tokens, owner = [], []
        for i, letter in enumerate(flat):
            for ch in letter['said']:
                tokens.append(self.dictionary[ch])
                owner.append(i)
        samples = torch.frombuffer(bytearray(decode(audio_bytes)), dtype=torch.float32)
        duration_ms = len(samples) / RATE * 1000
        heard = [None] * len(flat)
        if not tokens or len(samples) < RATE // 4:
            return {'heard': heard, 'durationMs': duration_ms}
        with self.lock, torch.inference_mode():
            emission, _ = self.model(samples.unsqueeze(0))
        frames = emission.shape[1]
        if frames < len(tokens):
            # Too short for every sound: nothing could be heard.
            return {'heard': heard, 'durationMs': duration_ms}
        targets = torch.tensor([tokens], dtype=torch.int32)
        path, scores = self.F.forced_align(emission, targets, blank=0)
        spans = self.F.merge_tokens(path[0], scores[0].exp())
        frame_ms = duration_ms / frames
        for span, i in zip(spans, owner):
            start, end = span.start * frame_ms, span.end * frame_ms
            had = heard[i]
            if had is None:
                heard[i] = {'startMs': start, 'endMs': end, 'scores': [span.score]}
            else:
                had['endMs'] = end
                had['scores'].append(span.score)
        for h in heard:
            if h:
                scores = h.pop('scores')
                h['score'] = round(float(sum(scores)) / len(scores), 3)
                h['startMs'], h['endMs'] = round(h['startMs']), round(h['endMs'])
        return {'heard': heard, 'durationMs': duration_ms}


class Handler(BaseHTTPRequestHandler):
    aligner = None

    def reply(self, status, body):
        data = json.dumps(body).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path == '/health':
            return self.reply(200, {'ok': True})
        self.reply(404, {'error': 'not_found'})

    def do_POST(self):
        if self.path != '/align':
            return self.reply(404, {'error': 'not_found'})
        length = int(self.headers.get('Content-Length', 0))
        if length <= 0 or length > MAX_BODY:
            return self.reply(413, {'error': 'too_large'})
        try:
            body = json.loads(self.rfile.read(length))
            letters, audio = body['letters'], base64.b64decode(body['audio'])
            if not isinstance(letters, list) or not letters or len(letters) > 400:
                raise ValueError('letters')
        except Exception:  # noqa: BLE001 - any malformed request is the same answer
            return self.reply(400, {'error': 'bad_request'})
        try:
            self.reply(200, self.aligner.align(letters, audio))
        except subprocess.CalledProcessError:
            self.reply(422, {'error': 'bad_audio'})

    def log_message(self, *args):
        pass  # No request logs: they would say when a child recited.


def main():
    Handler.aligner = Aligner()
    port = int(os.environ.get('SPEECH_PORT', 8790))
    server = ThreadingHTTPServer(('127.0.0.1', port), Handler)
    print(f'Voice feedback service on http://127.0.0.1:{port}', flush=True)
    server.serve_forever()


if __name__ == '__main__':
    main()
