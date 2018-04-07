from service.dto.movie_dto import MovieDto


class WatchHistoryDto:
    @staticmethod
    def create(watch_history):
        dto = []
        for next_movie_id in watch_history:
            dto.append(MovieDto().create(watch_history.movies[next_movie_id]))

        return dto
