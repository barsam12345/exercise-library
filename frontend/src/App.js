import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [exercises, setExercises] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    difficulty: '',
    muscle: '',
    equipment: '',
    posture: '',
    bodyRegion: '',
    mechanics: '',
    forceType: '',
    laterality: '',
    classification: '',
    movementPattern: '',
    planeOfMotion: ''
  });

  // Load filter options
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const response = await axios.get('/api/filters');
        setFilters(response.data);
      } catch (error) {
        console.error('Error loading filters:', error);
      }
    };
    loadFilters();
  }, []);

  // Load exercises
  useEffect(() => {
    loadExercises();
  }, [currentPage, searchTerm, selectedFilters]);

  const loadExercises = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 20,
        search: searchTerm,
        ...selectedFilters
      };

      const response = await axios.get('/api/exercises', { params });
      setExercises(response.data.exercises);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const renderYouTubeLink = (url, text) => {
    if (!url) return <span className="no-video">No video available</span>;
    
    return (
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="video-link"
      >
        {text}
      </a>
    );
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Exercise Library</h1>
      </header>

      <div className="container">
        {/* Search and Filters */}
        <div className="controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search exercises..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
          </div>

          <div className="filters">
            <select
              value={selectedFilters.difficulty}
              onChange={(e) => handleFilterChange('difficulty', e.target.value)}
              className="filter-select"
            >
              <option value="">All Difficulties</option>
              {filters.difficulties?.map(diff => (
                <option key={diff} value={diff}>{diff}</option>
              ))}
            </select>

            <select
              value={selectedFilters.muscle}
              onChange={(e) => handleFilterChange('muscle', e.target.value)}
              className="filter-select"
            >
              <option value="">All Muscle Groups</option>
              {filters.muscles?.map(muscle => (
                <option key={muscle} value={muscle}>{muscle}</option>
              ))}
            </select>

            <select
              value={selectedFilters.equipment}
              onChange={(e) => handleFilterChange('equipment', e.target.value)}
              className="filter-select"
            >
              <option value="">All Equipment</option>
              {filters.equipment?.map(eq => (
                <option key={eq} value={eq}>{eq}</option>
              ))}
            </select>

            <select
              value={selectedFilters.posture}
              onChange={(e) => handleFilterChange('posture', e.target.value)}
              className="filter-select"
            >
              <option value="">All Postures</option>
              {filters.postures?.map(posture => (
                <option key={posture} value={posture}>{posture}</option>
              ))}
            </select>

            <select
              value={selectedFilters.bodyRegion}
              onChange={(e) => handleFilterChange('bodyRegion', e.target.value)}
              className="filter-select"
            >
              <option value="">All Body Regions</option>
              {filters.bodyRegions?.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>

            <select
              value={selectedFilters.mechanics}
              onChange={(e) => handleFilterChange('mechanics', e.target.value)}
              className="filter-select"
            >
              <option value="">All Mechanics</option>
              {filters.mechanics?.map(mech => (
                <option key={mech} value={mech}>{mech}</option>
              ))}
            </select>

            <select
              value={selectedFilters.classification}
              onChange={(e) => handleFilterChange('classification', e.target.value)}
              className="filter-select"
            >
              <option value="">All Classifications</option>
              {filters.classifications?.map(classification => (
                <option key={classification} value={classification}>{classification}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Exercise Grid */}
        {loading ? (
          <div className="loading">Loading exercises...</div>
        ) : (
          <div className="exercise-grid">
            {exercises.map(exercise => (
              <div key={exercise.id} className="exercise-card">
                <h3 className="exercise-name">{exercise.Exercise}</h3>
                
                <div className="exercise-details">
                  <div className="detail-row">
                    <strong>Difficulty:</strong> {exercise['Difficulty Level']}
                  </div>
                  <div className="detail-row">
                    <strong>Target Muscle:</strong> {exercise['Target Muscle Group']}
                  </div>
                  <div className="detail-row">
                    <strong>Prime Mover:</strong> {exercise['Prime Mover Muscle']}
                  </div>
                  <div className="detail-row">
                    <strong>Equipment:</strong> {exercise['Primary Equipment']}
                  </div>
                  <div className="detail-row">
                    <strong>Posture:</strong> {exercise['Posture']}
                  </div>
                  <div className="detail-row">
                    <strong>Body Region:</strong> {exercise['Body Region']}
                  </div>
                  <div className="detail-row">
                    <strong>Mechanics:</strong> {exercise['Mechanics']}
                  </div>
                  <div className="detail-row">
                    <strong>Force Type:</strong> {exercise['Force Type']}
                  </div>
                  <div className="detail-row">
                    <strong>Laterality:</strong> {exercise['Laterality']}
                  </div>
                  <div className="detail-row">
                    <strong>Classification:</strong> {exercise['Primary Exercise Classification']}
                  </div>
                  <div className="detail-row">
                    <strong>Movement Pattern:</strong> {exercise['Movement Pattern #1']}
                  </div>
                  <div className="detail-row">
                    <strong>Plane of Motion:</strong> {exercise['Plane Of Motion #1']}
                  </div>
                </div>

                <div className="video-links">
                  <div className="video-link-row">
                    <strong>Demo:</strong> {renderYouTubeLink(exercise['Short YouTube Demonstration'], 'Watch Demo')}
                  </div>
                  <div className="video-link-row">
                    <strong>Detailed:</strong> {renderYouTubeLink(exercise['In-Depth YouTube Explanation'], 'Watch Explanation')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="page-btn"
            >
              Previous
            </button>
            
            <span className="page-info">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="page-btn"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App; 