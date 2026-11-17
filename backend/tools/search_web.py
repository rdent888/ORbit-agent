"""Tool: search_web — simple DuckDuckGo search via httpx"""
import httpx, json

SCHEMA = {
    "type": "function",
    "function": {
        "name": "search_web",
        "description": "Search the web for information using DuckDuckGo.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string"},
                "num_results": {"type": "integer", "default": 5},
            },
            "required": ["query"],
        },
    },
}

async def execute(args: dict, turbo: bool = False) -> str:
    query = args["query"]
    n = args.get("num_results", 5)
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                "https://api.duckduckgo.com/",
                params={"q": query, "format": "json", "no_html": 1, "skip_disambig": 1},
            )
            data = resp.json()
        results = []
        # AbstractText
        if data.get("AbstractText"):
            results.append(f"Summary: {data['AbstractText']}\nSource: {data.get('AbstractURL','')}")
        # Related topics
        for topic in data.get("RelatedTopics", [])[:n]:
            if isinstance(topic, dict) and topic.get("Text"):
                results.append(f"- {topic['Text']}\n  {topic.get('FirstURL','')}")
        return "\n\n".join(results) if results else f"No results found for: {query}"
    except Exception as ex:
        return f"Search error: {ex}"
