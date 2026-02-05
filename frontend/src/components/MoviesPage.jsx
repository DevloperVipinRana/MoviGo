import React from "react";
import { moviesPageStyles } from "../assets/dummyStyles";
import MOVIES from "../assets/dummymdata";

const MoviesPage = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [showAll, setShowAll] = useState(false);
  const movies = MOVIES;
  const filteredMovies =
    activeCategory === "all"
      ? movies
      : movies.filter((movie) => movie.category === activeCategory);
  const COLLAPSE_COUNT = 12;

    useEffect(() => {
      setShowAll(false)
    
    }, [activeCategory])

    const visibleMovies = showAll ? filteredMovies : filteredMovies.slice(0, COLLAPSE_COUNT);

  const categories = [
    { id: 'all', name: 'All Movies' },
    { id: 'action', name: 'Action' },
    { id: 'horror', name: 'Horror' },
    { id: 'comedy', name: 'Comedy' },
    { id: 'adventure', name: 'Adventure' }
  ];
    
  return <div>MO</div>;
};

export default MoviesPage;
