import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import LessonsModal from '../components/LessonsModal';
import { Search } from 'lucide-react';

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const Section = styled.section`
  background-color: #f9f9f9;
  padding: 1rem;
  border-radius: 8px;
`;

const CourseList = styled.ul`
  list-style-type: none;
  padding: 0;
`;

const CourseItem = styled.li`
  background-color: white;
  margin-bottom: 1rem;
  padding: 1rem;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const StyledButton = styled.button`
  background-color: #3498db;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 0.5rem;
  transition: background-color 0.3s;

  &:hover {
    background-color: #2980b9;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const TextArea = styled.textarea`
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
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

const SearchContainer = styled.div`
  display: flex;
  gap: 0.5rem;
`;

function Dashboard() {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [editingCourse, setEditingCourse] = useState(null);
  const [newCourse, setNewCourse] = useState({ title: '', description: '', type_id: '', category_id: '' });
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showLessonsModal, setShowLessonsModal] = useState(false);
  const { userRole } = useContext(AuthContext);
  const [categories, setCategories] = useState([]);
  const [courseTypes, setCourseTypes] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, [userRole, selectedCategory, selectedType]);

  const fetchData = async () => {
    try {
      const [enrolledResponse, allCoursesResponse, categoriesResponse, typesResponse] = await Promise.all([
        userRole === 'student' ? axios.get('http://localhost:3000/enrolled-courses', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          params: { search: searchQuery }
        }) : Promise.resolve({ data: [] }),
        axios.get('http://localhost:3000/courses', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          params: {
            category: selectedCategory,
            type: selectedType,
            search: searchQuery
          }
        }),
        axios.get('http://localhost:3000/categories', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get('http://localhost:3000/course-types', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      if (userRole === 'student') {
        setEnrolledCourses(enrolledResponse.data);
      }
      setAllCourses(allCoursesResponse.data);
      setCategories(categoriesResponse.data);
      setCourseTypes(typesResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handleTypeChange = (e) => {
    setSelectedType(e.target.value);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchData();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      fetchData();
    }
  };

  const handleEnroll = async (courseId) => {
    try {
      await axios.post('http://localhost:3000/enroll', { course_id: courseId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchData();
    } catch (error) {
      console.error('Error enrolling in course:', error);
      alert('Failed to enroll in the course. Please try again.');
    }
  };

  const handleUnenroll = async (courseId) => {
    try {
      await axios.delete(`http://localhost:3000/unenroll/${courseId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchData();
    } catch (error) {
      console.error('Error unenrolling from course:', error);
      alert('Failed to unenroll from the course. Please try again.');
    }
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:3000/courses/${editingCourse.course_id}`, editingCourse, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setEditingCourse(null);
      fetchData();
    } catch (error) {
      console.error('Error updating course:', error);
      alert('Failed to update the course. Please try again.');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await axios.delete(`http://localhost:3000/courses/${courseId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        fetchData();
      } catch (error) {
        console.error('Error deleting course:', error);
        alert('Failed to delete the course. Please try again.');
      }
    }
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/courses', newCourse, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNewCourse({ title: '', description: '', type_id: '', category_id: '' });
      fetchData();
    } catch (error) {
      console.error('Error adding course:', error);
      alert('Failed to add the course. Please try again.');
    }
  };

  const handleViewLessons = (course) => {
    setSelectedCourse(course);
    setShowLessonsModal(true);
  };

  return (
    <DashboardContainer>
      <h1>Dashboard</h1>
      {userRole === 'student' && (
        <Section>
          <h2>Enrolled Courses</h2>
          <SearchContainer>
            <Input
              type="text"
              placeholder="Search enrolled courses..."
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyPress={handleKeyPress}
            />
            <StyledButton onClick={handleSearch}>
              <Search className="mr-2 h-4 w-4" /> Search
            </StyledButton>
          </SearchContainer>
          <CourseList>
            {enrolledCourses.map((course) => (
              <CourseItem key={course.course_id}>
                <h3>{course.title}</h3>
                <p>{course.description}</p>
                <StyledButton onClick={() => handleViewLessons(course)}>View Lessons</StyledButton>
                <StyledButton onClick={() => handleUnenroll(course.course_id)}>Unenroll</StyledButton>
              </CourseItem>
            ))}
          </CourseList>
        </Section>
      )}
      <Section>
        <h2>All Courses</h2>
        <FilterContainer>
          <SearchContainer>
            <Input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyPress={handleKeyPress}
            />
            <StyledButton onClick={handleSearch}>
              <Search className="mr-2 h-4 w-4" /> Search
            </StyledButton>
          </SearchContainer>
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
        <CourseList>
          {allCourses.map((course) => (
            <CourseItem key={course.course_id}>
              <h3>{course.title}</h3>
              <p>{course.description}</p>
              <StyledButton onClick={() => handleViewLessons(course)}>View Lessons</StyledButton>
              {userRole === 'admin' && (
                <>
                  <StyledButton onClick={() => handleEditCourse(course)}>Edit</StyledButton>
                  <StyledButton onClick={() => handleDeleteCourse(course.course_id)}>Delete</StyledButton>
                </>
              )}
              {userRole === 'student' && (
                <StyledButton onClick={() => handleEnroll(course.course_id)}>
                  {enrolledCourses.some((c) => c.course_id === course.course_id)
                    ? 'Unenroll'
                    : 'Enroll'}
                </StyledButton>
              )}
            </CourseItem>
          ))}
        </CourseList>
      </Section>
      {userRole === 'admin' && (
        <Section>
          <h2>Add New Course</h2>
          <Form onSubmit={handleAddCourse}>
            <Input
              type="text"
              placeholder="Title"
              value={newCourse.title}
              onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
              required
            />
            <TextArea
              placeholder="Description"
              value={newCourse.description}
              onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
              required
            />
            <Select
              value={newCourse.type_id}
              onChange={(e) => setNewCourse({ ...newCourse, type_id: e.target.value })}
              required
            >
              <option value="">Select Type</option>
              {courseTypes.map((type) => (
                <option key={type.type_id} value={type.type_id}>
                  {type.type_name}
                </option>
              ))}
            </Select>
            <Select
              value={newCourse.category_id}
              onChange={(e) => setNewCourse({ ...newCourse, category_id: e.target.value })}
              required
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category.category_id} value={category.category_id}>
                  {category.category_name}
                </option>
              ))}
            </Select>
            <StyledButton type="submit">Add Course</StyledButton>
          </Form>
        </Section>
      )}
      {editingCourse && (
        <Section>
          <h2>Edit Course</h2>
          <Form onSubmit={handleUpdateCourse}>
            <Input
              type="text"
              placeholder="Title"
              value={editingCourse.title}
              onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
              required
            />
            <TextArea
              placeholder="Description"
              value={editingCourse.description}
              onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
              required
            />
            <Select
              value={editingCourse.type_id}
              onChange={(e) => setEditingCourse({ ...editingCourse, type_id: e.target.value })}
              required
            >
              <option value="">Select Type</option>
              {courseTypes.map((type) => (
                <option key={type.type_id} value={type.type_id}>
                  {type.type_name}
                </option>
              ))}
            </Select>
            <Select
              value={editingCourse.category_id}
              onChange={(e) => setEditingCourse({ ...editingCourse, category_id: e.target.value })}
              required
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category.category_id} value={category.category_id}>
                  {category.category_name}
                </option>
              ))}
            </Select>
            <StyledButton type="submit">Update Course</StyledButton>
            <StyledButton type="button" onClick={() => setEditingCourse(null)}>Cancel</StyledButton>
          </Form>
        </Section>
      )}
      {showLessonsModal && (
        <LessonsModal
          course={selectedCourse}
          onClose={() => setShowLessonsModal(false)}
          isAdmin={userRole === 'admin'}
        />
      )}
    </DashboardContainer>
  );
}

export default Dashboard;

