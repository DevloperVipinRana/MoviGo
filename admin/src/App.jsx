import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from './pages/Home'
import ListMovies from "./pages/ListMovies";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/listmovies" element={<ListMovies />} />
    </Routes>
  );
};

export default App;