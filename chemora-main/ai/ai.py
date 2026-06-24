from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Literal, TypedDict


class Message(TypedDict):
    role: Literal["assistant", "user"]
    content: str


SYSTEM_PROMPT = (
    "You are Chemora AI, a concise chemistry tutor inside a virtual chemistry lab. "
    "Answer chemistry questions from basic concepts to molecular behavior. Explain clearly, "
    "use equations when useful, and keep lab safety in mind."
)


def _json_request(url: str, headers: dict[str, str], payload: dict[str, Any]) -> dict[str, Any]:
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8")
        try:
            details = json.loads(body)
        except json.JSONDecodeError:
            details = {"error": body or error.reason}
        raise RuntimeError(_get_error_message(details) or str(error)) from error


def _clean_messages(messages: list[dict[str, Any]]) -> list[Message]:
    clean: list[Message] = []

    for message in messages:
        role = message.get("role")
        content = message.get("content")
        if role in {"assistant", "user"} and isinstance(content, str) and content.strip():
            clean.append({"role": role, "content": content[:4000]})

    return clean[-12:]


def _get_error_message(data: dict[str, Any]) -> str:
    error = data.get("error")
    if isinstance(error, str):
        return error
    if isinstance(error, dict) and isinstance(error.get("message"), str):
        return error["message"]
    return ""


def _get_answer(data: dict[str, Any]) -> str:
    candidates = data.get("candidates")
    if isinstance(candidates, list) and candidates:
        content = candidates[0].get("content") if isinstance(candidates[0], dict) else None
        parts = content.get("parts") if isinstance(content, dict) else None
        if isinstance(parts, list):
            answer = "\n".join(
                part.get("text", "") for part in parts if isinstance(part, dict) and part.get("text")
            )
            if answer:
                return answer

    choices = data.get("choices")
    if isinstance(choices, list) and choices:
        message = choices[0].get("message") if isinstance(choices[0], dict) else None
        content = message.get("content") if isinstance(message, dict) else None
        if isinstance(content, str):
            return content

    for key in ("output_text", "answer", "message", "text"):
        value = data.get(key)
        if isinstance(value, str):
            return value

    return ""


def _provider(api_key: str) -> str:
    provider = os.getenv("CHEMORA_PROVIDER", "").lower()
    if provider in {"gemini", "google"}:
        return "gemini"
    if provider == "openai":
        return "openai"
    return "gemini" if api_key.startswith(("AQ.", "AIza")) else "openai"


def ask_chemora(messages: list[dict[str, Any]]) -> str:
    api_key = os.getenv("chemora_api") or os.getenv("CHEMORA_API")
    if not api_key:
        raise RuntimeError("Missing chemora_api environment variable")

    clean_messages = _clean_messages(messages)
    if not clean_messages:
        raise RuntimeError("No messages provided")

    provider = _provider(api_key)
    model = os.getenv("CHEMORA_MODEL") or ("gemini-2.0-flash" if provider == "gemini" else "gpt-4o-mini")

    if provider == "gemini":
        gemini_model = model if model.startswith("gemini-") else "gemini-2.0-flash"
        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{gemini_model}:generateContent?key={urllib.parse.quote(api_key)}"
        )
        payload = {
            "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
            "contents": [
                {
                    "role": "model" if message["role"] == "assistant" else "user",
                    "parts": [{"text": message["content"]}],
                }
                for message in clean_messages
            ],
            "generationConfig": {"temperature": 0.35},
        }
        data = _json_request(url, {"Content-Type": "application/json"}, payload)
    else:
        url = os.getenv("CHEMORA_API_URL") or "https://api.openai.com/v1/chat/completions"
        payload = {
            "model": model,
            "messages": [{"role": "system", "content": SYSTEM_PROMPT}, *clean_messages],
            "temperature": 0.35,
        }
        data = _json_request(
            url,
            {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            payload,
        )

    answer = _get_answer(data)
    if not answer:
        raise RuntimeError("Chemora API provider returned no answer")
    return answer


def main() -> int:
    question = " ".join(sys.argv[1:]).strip()
    if not question:
        print("Usage: python ai.py \"your chemistry question\"", file=sys.stderr)
        return 2

    print(ask_chemora([{"role": "user", "content": question}]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
