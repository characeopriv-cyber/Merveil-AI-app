#!/usr/bin/env python3
"""
Merveil Doctor — one-shot health check for the Merveil system.

Run:
    python tools/merveil_doctor.py

This is a safe external health probe. It does not mutate Citizen auth,
Passport state, database data, or deployments.
"""

import json
import sys
import urllib.error
import urllib.request
from http.cookiejar import CookieJar

BASE = "https://junction.technology"
TIMEOUT = 15

GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
DIM = "\033[2m"
RESET = "\033[0m"


def ok(msg):
    print(f"  {GREEN}✓{RESET} {msg}")


def fail(msg):
    print(f"  {RED}✗{RESET} {msg}")


def warn(msg):
    print(f"  {YELLOW}!{RESET} {msg}")


def head(msg):
    print(f"\n{CYAN}▸ {msg}{RESET}")


def info(msg):
    print(f"  {DIM}{msg}{RESET}")


opener = urllib.request.build_opener(
    urllib.request.HTTPCookieProcessor(CookieJar())
)
results = {}


def get(path, raw=False):
    try:
        req = urllib.request.Request(
            BASE + path,
            headers={"Accept": "application/json", "User-Agent": "Merveil-Doctor/1.0"},
        )
        with opener.open(req, timeout=TIMEOUT) as response:
            body = response.read().decode("utf-8", "ignore")
            if raw:
                return response.status, body
            try:
                return response.status, json.loads(body)
            except Exception:
                return response.status, body
    except urllib.error.HTTPError as exc:
        try:
            body = exc.read().decode("utf-8", "ignore")
        except Exception:
            body = ""
        return exc.code, body
    except Exception as exc:
        return 0, str(exc)


def check_server():
    head("1. Server reachable")
    status, _ = get("/", raw=True)
    results["server"] = status == 200
    if results["server"]:
        ok("junction.technology responds")
    else:
        fail(f"server returned {status}")


def check_auth():
    head("2. Auth / session")
    status, data = get("/api/auth/session")
    if status == 401:
        warn("not signed in (expected when Doctor runs outside the browser)")
        info("The browser holds the Citizen session; this Python process does not.")
        results["auth"] = "no-cookie"
        return
    if status != 200:
        fail(f"session endpoint returned {status}")
        results["auth"] = False
        return
    if isinstance(data, dict) and data.get("user"):
        ok(f"signed in as {data['user'].get('name', '?')}")
        results["auth"] = True
    else:
        warn("no user in session response")
        results["auth"] = "empty"


def check_directory():
    head("3. Citizens directory")
    status, data = get("/api/conversations?action=directory")
    if status != 200:
        fail(f"returned {status}")
        results["directory"] = False
        return
    users = data.get("users") if isinstance(data, dict) else None
    if users is None:
        fail("response has no 'users' field")
        results["directory"] = False
        return
    if not users:
        warn("0 citizens returned — could be an empty dataset or an RLS restriction")
        results["directory"] = "empty"
    else:
        ok(f"{len(users)} citizens returned")
        results["directory"] = len(users)


def check_connections():
    head("4. My Circle")
    status, data = get("/api/connections?action=list&kind=accepted")
    if status != 200:
        fail(f"returned {status}")
        results["connections"] = False
        return
    connections = data.get("connections") if isinstance(data, dict) else None
    if connections is None:
        fail("response has no 'connections' field")
        results["connections"] = False
        return
    if not connections:
        warn("0 accepted connections")
        results["connections"] = "empty"
    else:
        ok(f"{len(connections)} connections")
        results["connections"] = len(connections)


def check_presence():
    head("5. Presence")
    status, _ = get(
        "/api/conversations?action=presence&userIds="
        "00000000-0000-0000-0000-000000000000"
    )
    results["presence"] = status == 200
    if results["presence"]:
        ok("presence endpoint responds")
    else:
        fail(f"returned {status}")


def check_world():
    head("6. World Reels")
    status, data = get("/api/world?limit=5")
    if status != 200:
        fail(f"returned {status}")
        results["world"] = False
        return
    posts = data.get("posts") if isinstance(data, dict) else None
    count = len(posts) if isinstance(posts, list) else 0
    ok(f"{count} world posts")
    results["world"] = count


def check_properties():
    head("7. Pulse listings")
    status, data = get("/api/properties")
    if status != 200:
        fail(f"returned {status}")
        results["properties"] = False
        return
    properties = data.get("properties") if isinstance(data, dict) else None
    count = len(properties) if isinstance(properties, list) else 0
    ok(f"{count} properties")
    results["properties"] = count


def verdict():
    head("SUMMARY")
    broken = []
    if not results.get("server"):
        broken.append("Server down")
    if results.get("directory") in (False, "empty"):
        broken.append("Citizens directory empty/unavailable")
    if results.get("connections") in (False, "empty"):
        broken.append("My Circle empty/unavailable")
    if results.get("presence") is False:
        broken.append("Presence endpoint broken")
    if results.get("world") is False:
        broken.append("World endpoint broken")
    if results.get("properties") is False:
        broken.append("Pulse endpoint broken")

    if not broken:
        print(f"\n  {GREEN}Everything looks healthy.{RESET}")
    else:
        print(f"\n  {RED}{len(broken)} issue(s) found:{RESET}")
        for item in broken:
            print(f"    • {item}")
    print()
    return 1 if broken else 0


def main():
    print(f"{CYAN}╭─────────────────────────────────────────╮")
    print(f"│  Merveil Doctor — system health check   │")
    print(f"╰─────────────────────────────────────────╯{RESET}")
    try:
        check_server()
        check_auth()
        check_directory()
        check_connections()
        check_presence()
        check_world()
        check_properties()
        return verdict()
    except KeyboardInterrupt:
        print("\n\nCancelled.\n")
        return 1


if __name__ == "__main__":
    sys.exit(main())
