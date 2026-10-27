"""Trusted PID-1 watchdog inside a fresh restricted Docker container.
Receives source/harness/stdin; expected outputs and server credentials never enter it.
"""
import json
import math
import os
from pathlib import Path
import resource
import selectors
import signal
import subprocess
import sys
import time

LIMIT = 65536


def run(args, stdin, seconds, memory_mb=512):
    started = time.monotonic()

    def limits():
        resource.setrlimit(resource.RLIMIT_CPU, (math.ceil(seconds), math.ceil(seconds) + 1))
        resource.setrlimit(resource.RLIMIT_FSIZE, (16 * 1024 * 1024, 16 * 1024 * 1024))
        resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
        resource.setrlimit(resource.RLIMIT_AS, (memory_mb * 1024 * 1024, memory_mb * 1024 * 1024))

    p = subprocess.Popen(args, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                         cwd="/work", start_new_session=True, preexec_fn=limits,
                         env={"PATH": "/usr/local/bin:/usr/bin:/bin", "LANG": "C.UTF-8", "HOME": "/tmp"})
    sel = selectors.DefaultSelector()
    payload = stdin.encode()
    pos = 0
    output = {"out": bytearray(), "err": bytearray()}
    total = 0
    status = "OK"
    for pipe, kind in ((p.stdout, "out"), (p.stderr, "err")):
        os.set_blocking(pipe.fileno(), False)
        sel.register(pipe, selectors.EVENT_READ, kind)
    if payload:
        os.set_blocking(p.stdin.fileno(), False)
        sel.register(p.stdin, selectors.EVENT_WRITE, "in")
    else:
        p.stdin.close()
    try:
        while sel.get_map():
            if time.monotonic() - started > seconds:
                status = "TLE"
                break
            for key, _ in sel.select(0.02):
                if key.data == "in":
                    try:
                        pos += os.write(key.fd, payload[pos:pos + 4096])
                    except BrokenPipeError:
                        pos = len(payload)
                    if pos >= len(payload):
                        sel.unregister(key.fileobj)
                        key.fileobj.close()
                else:
                    chunk = os.read(key.fd, 8192)
                    if not chunk:
                        sel.unregister(key.fileobj)
                        key.fileobj.close()
                        continue
                    output[key.data].extend(chunk[:max(0, LIMIT - total)])
                    total += len(chunk)
                    if total > LIMIT:
                        status = "OLE"
                        break
            if status == "OLE":
                break
        if status == "OK":
            try:
                p.wait(timeout=max(0.001, seconds - (time.monotonic() - started)))
            except subprocess.TimeoutExpired:
                status = "TLE"
    finally:
        try:
            os.killpg(p.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
        p.wait()
        sel.close()
        for pipe in (p.stdin, p.stdout, p.stderr):
            if not pipe.closed:
                pipe.close()
    stderr = output["err"].decode(errors="replace")
    if status == "OK" and p.returncode:
        status = "TLE" if p.returncode == -signal.SIGXCPU else "RE"
        if "MemoryError" in stderr or "std::bad_alloc" in stderr:
            status = "MLE"
    return {"verdict": status, "stdout": output["out"].decode(errors="replace"),
            "stderr": stderr, "timeMs": (time.monotonic() - started) * 1000}


def main():
    job = json.load(sys.stdin)
    seconds = min(10, max(1, int(job.get("seconds", 2))))
    language = job["language"]
    code = job.get("globalExtra", "") + "\n" + job["source"]
    if language == "PY311":
        code += "\n" + job.get("testcode", "") + "\n"
        Path("/work/main.py").write_text(code)
        compile_args = ["python3.11", "-I", "-S", "-m", "py_compile", "/work/main.py"]
        execute_args = ["python3.11", "-I", "-S", "-B", "/work/main.py"]
    else:
        standard = {"CPP11": "c++11", "CPP17": "c++17", "CPP20": "c++20"}[language]
        if job.get("type") == "cpp_function":
            code = "#include <bits/stdc++.h>\nusing namespace std;\n" + code
            code += "\nint main(){\n" + job.get("testcode", "") + "\n}\n"
        Path("/work/main.cpp").write_text(code)
        compile_args = ["g++", "-std=" + standard, "-O2", "-pipe", "/work/main.cpp", "-o", "/work/main"]
        execute_args = ["/work/main"]
    compiled = run(compile_args, "", 20)
    if compiled["verdict"] != "OK":
        return {"verdict": "CE", "stdout": "", "compileMs": compiled["timeMs"],
                "timeMs": 0, "diagnostic": compiled["stderr"][:4000]}
    result = run(execute_args, job.get("stdin", ""), seconds, min(512, max(64, int(job.get("memoryMb",256)))))
    result["compileMs"] = compiled["timeMs"]
    result["diagnostic"] = result.pop("stderr")[:4000]
    return result


if __name__ == "__main__":
    try:
        answer = main()
        print(json.dumps(answer), flush=True)
    except Exception:
        # Nonzero exit is an infrastructure error, not a contestant RE.
        sys.exit(70)
