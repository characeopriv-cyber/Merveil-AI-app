#!/usr/bin/env python3
"""Merveil Strong Debug — structured, context-aware diagnostic layer.

Safe by default: sensitive field names are redacted, values are truncated,
and logging never changes application state. Designed as a reusable base for
Merveil Doctor, Debug Engine, and future distributed services.
"""

import contextvars
import functools
import json
import os
import sys
import threading
import time
import traceback
from contextlib import contextmanager
from datetime import datetime, timezone

_LEVELS = {"TRACE": 5, "DEBUG": 10, "INFO": 20, "WARN": 30, "ERROR": 40, "FATAL": 50}
_CTX = contextvars.ContextVar("merveil_debug_ctx", default={})


def _now():
    return datetime.now(timezone.utc).isoformat()


class StrongDebug:
    def __init__(self, name="merveil", level=None, jsonl=None, console=True,
                 redact=None, max_value_len=1000):
        raw_level = (level or os.getenv("STRONG_DEBUG_LEVEL", "DEBUG")).upper()
        self.name = name
        self.level = _LEVELS.get(raw_level, _LEVELS["DEBUG"])
        self.jsonl = jsonl or os.getenv("STRONG_DEBUG_JSONL")
        self.console = console
        self.redact = {str(x).lower() for x in (redact or [
            "password", "token", "secret", "authorization", "cookie",
            "api_key", "apikey", "access_token", "refresh_token",
            "service_role", "private_key", "client_secret",
        ])}
        self.max_value_len = max(1, int(max_value_len))
        self._lock = threading.RLock()

    def _ctx(self):
        return dict(_CTX.get())

    @contextmanager
    def context(self, **kwargs):
        old = _CTX.get()
        token = _CTX.set({**old, **kwargs})
        try:
            yield self
        finally:
            _CTX.reset(token)

    def _is_sensitive(self, key):
        key = str(key).lower()
        return key in self.redact or any(secret in key for secret in self.redact)

    def _clean(self, value):
        if isinstance(value, dict):
            return {
                k: ("***REDACTED***" if self._is_sensitive(k) else self._clean(v))
                for k, v in value.items()
            }
        if isinstance(value, (list, tuple, set)):
            return [self._clean(v) for v in value]
        if isinstance(value, bytes):
            return f"<bytes:{len(value)}>"
        if isinstance(value, str):
            if len(value) <= self.max_value_len:
                return value
            return value[:self.max_value_len] + "...<truncated>"
        return value

    def _emit(self, level, msg, **fields):
        if _LEVELS[level] < self.level:
            return

        rec = {
            "ts": _now(),
            "level": level,
            "logger": self.name,
            "msg": str(msg),
            "ctx": self._clean(self._ctx()),
            "fields": self._clean(fields),
            "thread": threading.current_thread().name,
            "pid": os.getpid(),
        }
        line = json.dumps(rec, default=str, ensure_ascii=False)

        with self._lock:
            if self.jsonl:
                try:
                    with open(self.jsonl, "a", encoding="utf-8") as stream:
                        stream.write(line + "\n")
                except OSError:
                    # Logging must never crash the application because a log
                    # destination is unavailable.
                    pass
            if self.console:
                print(
                    f"{rec['ts']} {level:5} [{rec['logger']}] {rec['msg']} "
                    f"{json.dumps(rec['fields'], default=str, ensure_ascii=False)}",
                    file=sys.stderr,
                )

    def trace(self, msg, **fields): self._emit("TRACE", msg, **fields)
    def debug(self, msg, **fields): self._emit("DEBUG", msg, **fields)
    def info(self, msg, **fields): self._emit("INFO", msg, **fields)
    def warn(self, msg, **fields): self._emit("WARN", msg, **fields)
    def error(self, msg, **fields): self._emit("ERROR", msg, **fields)
    def fatal(self, msg, **fields): self._emit("FATAL", msg, **fields)

    @contextmanager
    def timer(self, name, **fields):
        started = time.perf_counter()
        try:
            yield
        finally:
            duration_ms = (time.perf_counter() - started) * 1000
            self.debug(f"timer:{name}", duration_ms=round(duration_ms, 3), **fields)

    def checkpoint(self, name, **state):
        self.info(f"checkpoint:{name}", **state)

    def assert_invariant(self, condition, message, **fields):
        if not condition:
            self.error(f"INVARIANT FAILED: {message}", **fields)
            raise AssertionError(message)

    def exception(self, exc, **fields):
        self.error(
            "exception",
            exc_type=type(exc).__name__,
            exc=str(exc),
            traceback=traceback.format_exc(),
            **fields,
        )

    def dump_state(self, obj, name="state"):
        self.debug(f"dump:{name}", state=self._clean(obj))


debug = StrongDebug()


def trace(fn):
    """Trace a synchronous function without changing its return behavior."""
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        with debug.timer(fn.__qualname__, args=str(args)[:300], kwargs=str(kwargs)[:300]):
            try:
                return fn(*args, **kwargs)
            except Exception as exc:
                debug.exception(exc, function=fn.__qualname__)
                raise
    return wrapper
