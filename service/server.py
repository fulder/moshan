from flask import Flask, Response, jsonify, request

from domain.watch_histories import WatchHistories
from flasgger import Swagger, swag_from
from flask_cors import CORS
from service.dto.watch_history_dto import WatchHistoryDto
from utils.log import Log

app = Flask(__name__)
cors = CORS(app, resources={r"/*": {"origins": "*"}})
Swagger(app, template_file='swagger/template.yml')

watch_histories = WatchHistories()

log = Log().get_logger(__name__)


@app.route("/<user_id>/watch-history/<movie_id>", methods=["post"])
@swag_from("swagger/movie.yml")
def add_movie(user_id, movie_id):
    watch_history = watch_histories.get_watch_history(user_id)
    watch_history.add_movie(movie_id)
    log.info("Added movie: {} for user: {}".format(movie_id, user_id))
    return Response(status=200, mimetype='application/json')


@app.route("/watch-history", methods=["get"])
@swag_from("swagger/movie.yml")
def get_watch_history():
    user_id = request.headers.get("user_id")
    watch_history = watch_histories.get_watch_history(user_id)

    data = WatchHistoryDto().create(watch_history)

    return jsonify(data)


@app.route("/watch-history", methods=["delete"])
@swag_from("swagger/movie.yml")
def remove_movie():
    user_id = request.headers.get("user_id")
    data = request.get_json(silent=True)
    movie_id = data["movie_id"]

    watch_history = watch_histories.get_watch_history(user_id)
    watch_history.remove_movie(movie_id)
    log.info("Removed movie: {} for user: {}".format(movie_id, user_id))
    return Response(status=200, mimetype='application/json')
