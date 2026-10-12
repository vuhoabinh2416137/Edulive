package com.edulive.repository;

import com.edulive.entity.Discussion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiscussionRepository extends JpaRepository<Discussion, Long> {
    List<Discussion> findByCourseIdOrderByIsPinnedDescCreatedAtDesc(Long courseId);
    List<Discussion> findByCourseIdAndLessonIdOrderByIsPinnedDescCreatedAtDesc(Long courseId, Long lessonId);
    long countByCourseId(Long courseId);
}
