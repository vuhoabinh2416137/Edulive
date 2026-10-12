package com.edulive.repository;

import com.edulive.entity.LessonCompletion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LessonCompletionRepository extends JpaRepository<LessonCompletion, Long> {

    boolean existsByEnrollmentIdAndLessonId(Long enrollmentId, Long lessonId);

    Optional<LessonCompletion> findByEnrollmentIdAndLessonId(Long enrollmentId, Long lessonId);

    long countByEnrollmentId(Long enrollmentId);

    @Query("SELECT lc.lesson.id FROM LessonCompletion lc WHERE lc.enrollment.id = :enrollmentId")
    List<Long> findCompletedLessonIdsByEnrollmentId(@Param("enrollmentId") Long enrollmentId);
}
