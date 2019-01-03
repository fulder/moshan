# Pre requirements

* python3.7
* pip install -r requirements.txt

# Start server

* python run_flask.py
* API base URL: `http://localhost:5000/`

# API docs

For api docs go to http://localhost:8083/apidocs

# Running in docker

* docker build -t watch-history-service:1.0 .
* docker run -p 8083:8083 -d -t watch-history-service:1.0

