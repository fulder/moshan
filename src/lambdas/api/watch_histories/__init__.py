from fastapi import FastAPI

app = FastAPI()


@app.get("/watch-histories/item")
async def root():
    return {"message": "Hello World"}
