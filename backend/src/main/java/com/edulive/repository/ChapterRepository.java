package com.edulive.repository;

import com.edulive.entity.Chapter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChapterRepository extends JpaRepository<Chapter, Long> {

    List<Chapter> findByCourseIdOrderByOrderIndexAsc(Long courseId);

    long countByCourseId(Long courseId);
}
