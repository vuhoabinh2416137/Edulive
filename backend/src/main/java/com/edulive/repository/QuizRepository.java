package com.edulive.repository;

import com.edulive.entity.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {
    List<Quiz> findByCourseIdOrderByCreatedAtAsc(Long courseId);
    List<Quiz> findByCourseId(Long courseId);
    long countByCourseId(Long courseId);
}
