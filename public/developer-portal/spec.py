from pydantic import BaseModel, Field
from typing import Any

class ModelCfg(BaseModel):
    provider: str = "anthropic"
    name: str = "claude-sonnet-4-5"
    temperature: float = 0.3
    max_tokens: int = 2048
    fallback: dict | None = None

class PromptCfg(BaseModel):
    system: str = "You are a helpful Merveil agent."
    input_variables: list[str] = Field(default_factory=list)

class MemoryCfg(BaseModel):
    short_term: dict = Field(default_factory=lambda: {"window": 20})
    long_term: dict = Field(default_factory=lambda: {"enabled": False, "top_k": 6})

class Guardrails(BaseModel):
    max_steps: int = 12
    max_credits: int = 200
    max_seconds: int = 90
    pii_redaction: bool = True
    blocked_topics: list[str] = Field(default_factory=list)
    allowed_domains: list[str] = Field(default_factory=list)

class AgentSpec(BaseModel):
    name: str = "Agent"
    description: str = ""
    model: ModelCfg = Field(default_factory=ModelCfg)
    prompt: PromptCfg = Field(default_factory=PromptCfg)
    tools: list[dict] = Field(default_factory=list)
    memory: MemoryCfg = Field(default_factory=MemoryCfg)
    guardrails: Guardrails = Field(default_factory=Guardrails)
    handoff: dict = Field(default_factory=dict)
    output: dict = Field(default_factory=dict)
    channels: dict = Field(default_factory=lambda: {"api": True, "web": True})
