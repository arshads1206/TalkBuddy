import json
import subprocess
import os
import sys
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import httpx

http_client: httpx.AsyncClient = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global http_client
    http_client = httpx.AsyncClient()
    yield
    await http_client.aclose()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper to run the node.js DB wrapper
def run_db_op(name: str, params: dict = None):
    # Determine the node executable path from the virtual environment if possible
    # We'll just use 'node' and rely on the shell PATH.
    payload = json.dumps({"name": name, "params": params or {}})
    script_path = os.path.join(os.path.dirname(__file__), "run_db_op.js")
    
    try:
        result = subprocess.run(
            ["node", "--experimental-sqlite", script_path, payload],
            capture_output=True,
            text=True,
            encoding="utf-8",
            check=False
        )
        # Try to parse the last line of stdout as JSON
        lines = result.stdout.strip().split('\n')
        last_line = lines[-1] if lines else "{}"
        return json.loads(last_line)
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/db/op")
async def db_op(request: Request):
    data = await request.json()
    name = data.get("name")
    params = data.get("params", {})
    return run_db_op(name, params)

@app.post("/api/db/reset")
async def db_reset():
    return run_db_op("debug:reset") # No exact match, but this simulates it

@app.get("/api/secrets/{key}")
async def get_secret(key: str):
    import keyring
    try:
        val = keyring.get_password("TalkBuddy", key)
        return {"value": val}
    except:
        return {"value": None}

@app.post("/api/secrets/{key}")
async def set_secret(key: str, request: Request):
    import keyring
    data = await request.json()
    val = data.get("value")
    try:
        if val:
            keyring.set_password("TalkBuddy", key, val)
        else:
            try:
                keyring.delete_password("TalkBuddy", key)
            except:
                pass
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/proxy/fetch")
async def proxy_fetch(request: Request):
    data = await request.json()
    url = data.get("url")
    options = data.get("options", {})
    
    method = options.get("method", "GET")
    headers = options.get("headers", {})
    body = options.get("body")
    
    # Do not forward host header
    if "host" in headers:
        del headers["host"]
        
    try:
        resp = await http_client.request(
            method, 
            url, 
            headers=headers, 
            content=body,
            timeout=60.0
        )
        import base64
        return {
            "ok": resp.status_code < 400,
            "status": resp.status_code,
            "statusText": resp.reason_phrase,
            "b64Data": base64.b64encode(resp.content).decode("utf-8")
        }
    except Exception as e:
        return {"ok": False, "error": str(e)}

@app.post("/api/proxy/fetchText")
async def proxy_fetch_text(request: Request):
    data = await request.json()
    url = data.get("url")
    try:
        resp = await http_client.get(url, timeout=30.0)
        return {
            "ok": resp.status_code < 400,
            "text": resp.text
        }
    except Exception as e:
        return {"ok": False, "error": str(e)}

@app.get("/api/embedded/status")
async def embedded_status():
    try:
        resp = await http_client.get("http://127.0.0.1:8765/health", timeout=2.0)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("status") == "healthy":
                return {
                    "running": True,
                    "healthy": True,
                    "url": "http://127.0.0.1:8765",
                    "port": 8765
                }
    except Exception:
        pass
        
    return {
        "running": False,
        "healthy": False,
        "url": "",
        "port": 0
    }

@app.post("/api/embedded/start")
async def embedded_start():
    return {"success": False, "error": "Not supported in browser mode"}

@app.post("/api/embedded/stop")
async def embedded_stop():
    return {"success": True}

@app.post("/api/embedded/restart")
async def embedded_restart():
    return {"success": False, "error": "Not supported"}

@app.get("/api/embedded/install/check")
async def embedded_install_check():
    return {"installed": False, "version": None}

@app.post("/api/embedded/install/run")
async def embedded_install_run():
    return {"ok": False, "error": "Cannot install embedded server from browser"}

@app.post("/api/embedded/install/cancel")
async def embedded_install_cancel():
    return {"ok": True}

@app.get("/api/app/version")
async def app_version():
    return {"version": "2.13.0"}

@app.get("/api/app/path/{name}")
async def app_path(name: str):
    return {"path": os.getcwd()}

@app.get("/api/app/env/{name}")
async def app_env(name: str):
    return {"value": os.environ.get(name, "")}

@app.post("/api/speaches/transcribe")
async def transcribe(request: Request):
    data = await request.json()
    url = data.get("url")
    api_key = data.get("apiKey")
    model = data.get("model")
    audio_b64 = data.get("audioBuffer")
    
    import base64
    audio_bytes = base64.b64decode(audio_b64)
    
    # We will upload to the STT API via multipart form
    files = {'file': ('audio.wav', audio_bytes, 'audio/wav')}
    data_form = {'model': model}
    headers = {'Authorization': f'Bearer {api_key}'} if api_key else {}
    
    try:
        resp = await http_client.post(
            f"{url.rstrip('/')}/v1/audio/transcriptions",
            data=data_form,
            files=files,
            headers=headers,
            timeout=30.0
        )
        return resp.json()
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/speaches/speak")
async def speak(request: Request):
    data = await request.json()
    url = data.get("url")
    api_key = data.get("apiKey")
    payload = data.get("payload")
    
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    } if api_key else {'Content-Type': 'application/json'}
    
    try:
        resp = await http_client.post(
            f"{url.rstrip('/')}/v1/audio/speech",
            json=payload,
            headers=headers,
            timeout=60.0
        )
        import base64
        b64_audio = base64.b64encode(resp.content).decode('utf-8')
        return {"audio": b64_audio}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=3308, reload=True)
