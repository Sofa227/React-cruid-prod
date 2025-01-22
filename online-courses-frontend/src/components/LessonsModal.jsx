import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  width: 80%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
`;

const LessonList = styled.ul`
  list-style-type: none;
  padding: 0;
`;

const LessonItem = styled.li`
  margin-bottom: 1rem;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const Button = styled.button`
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

function LessonsModal({ course, onClose, isAdmin }) {
  const [lessons, setLessons] = useState([]);
  const [newLesson, setNewLesson] = useState({ title: '', content: '', lesson_order: '' });
  const [editingLesson, setEditingLesson] = useState(null);

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/courses/${course.course_id}/lessons`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setLessons(response.data);
    } catch (error) {
      console.error('Error fetching lessons:', error);
    }
  };

  const handleAddLesson = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`http://localhost:3000/courses/${course.course_id}/lessons`, newLesson, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNewLesson({ title: '', content: '', lesson_order: '' });
      fetchLessons();
    } catch (error) {
      console.error('Error adding lesson:', error);
      alert('Failed to add the lesson. Please try again.');
    }
  };

  const handleUpdateLesson = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:3000/courses/${course.course_id}/lessons/${editingLesson.lesson_id}`, editingLesson, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setEditingLesson(null);
      fetchLessons();
    } catch (error) {
      console.error('Error updating lesson:', error);
      alert('Failed to update the lesson. Please try again.');
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (window.confirm('Are you sure you want to delete this lesson?')) {
      try {
        await axios.delete(`http://localhost:3000/courses/${course.course_id}/lessons/${lessonId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        fetchLessons();
      } catch (error) {
        console.error('Error deleting lesson:', error);
        alert('Failed to delete the lesson. Please try again.');
      }
    }
  };

  return (
    <ModalOverlay>
      <ModalContent>
        <h2>Lessons for {course.title}</h2>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        <LessonList>
          {lessons.map((lesson) => (
            <LessonItem key={lesson.lesson_id}>
              <h3>{lesson.title}</h3>
              <p>{lesson.content}</p>
              {isAdmin && (
                <>
                  <Button onClick={() => setEditingLesson(lesson)}>Edit</Button>
                  <Button onClick={() => handleDeleteLesson(lesson.lesson_id)}>Delete</Button>
                </>
              )}
            </LessonItem>
          ))}
        </LessonList>
        {isAdmin && (
          <>
            <h3>Add New Lesson</h3>
            <Form onSubmit={handleAddLesson}>
              <Input
                type="text"
                placeholder="Title"
                value={newLesson.title}
                onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                required
              />
              <TextArea
                placeholder="Content"
                value={newLesson.content}
                onChange={(e) => setNewLesson({ ...newLesson, content: e.target.value })}
                required
              />
              <Input
                type="number"
                placeholder="Lesson Order"
                value={newLesson.lesson_order}
                onChange={(e) => setNewLesson({ ...newLesson, lesson_order: e.target.value })}
                required
              />
              <Button type="submit">Add Lesson</Button>
            </Form>
          </>
        )}
        {editingLesson && (
          <>
            <h3>Edit Lesson</h3>
            <Form onSubmit={handleUpdateLesson}>
              <Input
                type="text"
                placeholder="Title"
                value={editingLesson.title}
                onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                required
              />
              <TextArea
                placeholder="Content"
                value={editingLesson.content}
                onChange={(e) => setEditingLesson({ ...editingLesson, content: e.target.value })}
                required
              />
              <Input
                type="number"
                placeholder="Lesson Order"
                value={editingLesson.lesson_order}
                onChange={(e) => setEditingLesson({ ...editingLesson, lesson_order: e.target.value })}
                required
              />
              <Button type="submit">Update Lesson</Button>
              <Button type="button" onClick={() => setEditingLesson(null)}>Cancel</Button>
            </Form>
          </>
        )}
      </ModalContent>
    </ModalOverlay>
  );
}

export default LessonsModal;