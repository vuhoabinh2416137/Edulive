package com.edulive.repository;

import com.edulive.entity.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {
    List<QuizAttempt> findByQuizIdAndUserIdOrderByStartedAtDesc(Long quizId, Long userId);
    List<QuizAttempt> findByQuizIdOrderByStartedAtDesc(Long quizId);
    List<QuizAttempt> findByUserIdOrderByStartedAtDesc(Long userId);
    long countByQuizIdAndUserId(Long quizId, Long userId);
    long countByUserId(Long userId);
    Optional<QuizAttempt> findTopByQuizIdAndUserIdOrderByScoreDesc(Long quizId, Long userId);
    List<QuizAttempt> findByQuizCourseId(Long courseId);
}
