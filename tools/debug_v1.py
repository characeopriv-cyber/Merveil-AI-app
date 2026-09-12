"""Merveil Debug V1 shared diagnosis helpers.
Safe by default: never mutates projects, auth, databases, or deployments.
"""
from __future__ import annotations
import json, re
from pathlib import PurePosixPath

SECRET_FILE = re.compile(r"(^|/)(\.env(?:\..*)?|.*\.pem|.*\.key|.*\.p12|.*\.pfx|credentials?\.json)$", re.I)
TEXT_EXT = {'.js','.jsx','.ts','.tsx','.mjs','.cjs','.json','.css','.html','.md','.sql','.yml','.yaml','.py','.java','.vue','.svelte'}


def safe_path(path: str) -> bool:
    p = str(path or '').replace('\\','/').lstrip('/')
    return '..' not in PurePosixPath(p).parts and not SECRET_FILE.search(p)


def scan_files(files: list[dict]) -> dict:
    issues=[]; paths=[]; total=0
    for item in files[:500]:
        path=str(item.get('path','')).replace('\\','/')
        content=str(item.get('content',''))
        if not safe_path(path) or len(content)>500_000 or PurePosixPath(path).suffix.lower() not in TEXT_EXT:
            continue
        paths.append(path); total += len(content)
        for n,line in enumerate(content.splitlines(),1):
            if re.search(r'(api[_-]?key|secret|access[_-]?token|refresh[_-]?token)\s*[:=]\s*["\'][^"\']{8,}', line, re.I):
                issues.append({'severity':'error','code':'SECRET_LIKE_VALUE','message':'Possible hard-coded secret detected. Remove it and use server-side environment configuration.','file':path,'line':n})
            if 'TODO' in line or 'FIXME' in line:
                issues.append({'severity':'warn','code':'TODO','message':'Unfinished work marker found.','file':path,'line':n})
            if re.search(r'console\.(log|debug)\(',line) and not path.endswith(('.test.js','.test.ts')):
                issues.append({'severity':'info','code':'CONSOLE_LOG','message':'Console logging should be reviewed before production.','file':path,'line':n})
    names=set(paths)
    if not any(p in names for p in ('package.json','pyproject.toml','requirements.txt')):
        issues.append({'severity':'error','code':'NO_MANIFEST','message':'No recognized project dependency manifest was found.'})
    if any(p.startswith('src/') for p in names) and not any(p in names for p in ('src/main.tsx','src/main.jsx','src/main.ts','src/index.tsx','src/index.jsx')):
        issues.append({'severity':'warn','code':'ENTRYPOINT_REVIEW','message':'A src directory exists but no common application entry point was detected.'})
    errors=sum(i['severity']=='error' for i in issues); warns=sum(i['severity']=='warn' for i in issues)
    score=max(0,100-errors*18-warns*6-sum(i['severity']=='info' for i in issues))
    return {'score':score,'status':'Healthy' if score>=90 else 'Review needed' if score>=70 else 'Problems detected','filesScanned':len(paths),'bytesScanned':total,'counts':{'error':errors,'warn':warns,'info':sum(i['severity']=='info' for i in issues)},'issues':issues[:100]}


def redact_payload(value):
    """Return a safe diagnostic representation without credential values."""
    if isinstance(value, dict):
        return {k: '[REDACTED]' if re.search(r'(password|token|secret|authorization|cookie|api[_-]?key|private[_-]?key)', str(k), re.I) else redact_payload(v) for k,v in value.items()}
    if isinstance(value, list): return [redact_payload(v) for v in value[:100]]
    return value
