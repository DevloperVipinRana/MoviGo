import React from "react";
import { moviesStyles } from "../assets/dummyStyles";
import movies from "../assets/dummymoviedata";
import { Link } from "react-router-dom";
import { Tickets } from "lucide-react";

const Movies = () => {
  const visibleMovies = movies.slice(0, 6);
  return (
    <section className={moviesStyles.container}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Pacifico&display=swap');
      `}</style>

      <h2
        style={{
          fontFamily: "'Dancing Script', cursive",
        }}
        className={moviesStyles.title}
      >
        Featured Movies
      </h2>

      <div className={moviesStyles.grid}>
        {visibleMovies.map((m) => (
          <article key={m.id} className={moviesStyles.movieArticle}>
            <Link to={`/movie/${m.id}`} className={moviesStyles.movieLink}>
              <img
                src={m.img}
                alt={m.title}
                loading="lazy"
                className={moviesStyles.movieImage}
              />
            </Link>

            <div className={moviesStyles.movieInfo}>
                <div className={moviesStyles.titleContainer}>
                    <Tickets size={20} className="text-red-600 mr-2" />
                    <span id={`movie-title-${m.id}`} className={moviesStyles.movieTitle}
                    style={{
                        fontFamily: "'Pacifico', cursive"
                    }}>
                        {m.title}
                    </span>
                </div>
                <div className={moviesStyles.categoryContainer}>
                    <span className={moviesStyles.categoryText}>
                        {m.category}
                    </span>
                </div>
            </div>

          </article>
        ))}
      </div>
    </section>
  );
};

export default Movies;
