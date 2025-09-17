import os, json

def handler(request):
    v = os.environ.get("NEWS_API_KEY")
    body = json.dumps({"hasKey": bool(v), "len": (len(v) if v else 0)})
    return (
        body,
        200,
        {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
            "Access-Control-Allow-Origin": os.environ.get("ALLOWED_ORIGIN", "*"),
        },
    )
