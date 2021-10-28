from fastapi import FastAPI
from mangum import Mangum

app = FastAPI()


@app.get("/watch-histories/item")
def item(api_name: str, api_id: str):
    return {"message": f"Got {api_name}_{api_id}"}


handler = Mangum(app)
