import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from './pages/Home'
import ListMovies from "./pages/ListMovies";
import Dashboard from "./pages/Dashboard";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/listmovies" element={<ListMovies />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
};

export default App;