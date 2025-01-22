import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';

const CoursesContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
`;

const CourseCard = styled.div`
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
`;

const CourseTitle = styled.h2`
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
`;

const CourseDescription = styled.p`
  font-size: 0.9rem;
  color: #666;
  flex-grow: 1;
`;

const CourseButton = styled.button`
  background-color: #3498db;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #2980b9;
  }
`;

const LoadingMessage = styled.p`
  text-align: center;
  font-size: 1.2rem;
  margin-top: 2rem;
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

function Courses() {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [courseTypes, setCourseTypes] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [coursesResponse, categoriesResponse, typesResponse] = await Promise.all([
          axios.get('http://localhost:3000/courses', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            params: {
              category: selectedCategory,
              type: selectedType
            }
          }),
          axios.get('http://localhost:3000/categories', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }),
          axios.get('http://localhost:3000/course-types', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          })
        ]);

        setCourses(coursesResponse.data);
        setCategories(categoriesResponse.data);
        setCourseTypes(typesResponse.data);
        setError('');
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load courses. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory, selectedType]);

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handleTypeChange = (e) => {
    setSelectedType(e.target.value);
  };

  const handleViewCourse = (courseId) => {
    // Implement view course functionality
    console.log(`View course with ID: ${courseId}`);
  };

  if (isLoading) {
    return <LoadingMessage>Loading courses...</LoadingMessage>;
  }

  return (
    <div>
      <h1>Available Courses</h1>
      {error && <p>{error}</p>}
      <FilterContainer>
        <Select value={selectedCategory} onChange={handleCategoryChange}>
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category.category_id} value={category.category_id}>
              {category.category_name}
            </option>
          ))}
        </Select>
        <Select value={selectedType} onChange={handleTypeChange}>
          <option value="">All Types</option>
          {courseTypes.map((type) => (
            <option key={type.type_id} value={type.type_id}>
              {type.type_name}
            </option>
          ))}
        </Select>
      </FilterContainer>
      <CoursesContainer>
        {courses.map((course) => (
          <CourseCard key={course.course_id}>
            <CourseTitle>{course.title}</CourseTitle>
            <CourseDescription>{course.description}</CourseDescription>
            <p>Type: {course.type_name}, Category: {course.category_name}</p>
            <CourseButton onClick={() => handleViewCourse(course.course_id)}>View Course</CourseButton>
          </CourseCard>
        ))}
      </CoursesContainer>
    </div>
  );
}

export default Courses;