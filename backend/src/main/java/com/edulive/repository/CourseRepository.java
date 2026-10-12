package com.edulive.repository;

import com.edulive.entity.Course;
import com.edulive.entity.CourseStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {

    Optional<Course> findBySlug(String slug);

    Optional<Course> findByClassCode(String classCode);

    boolean existsByClassCode(String classCode);

    boolean existsBySlug(String slug);

    Page<Course> findByLecturerId(Long lecturerId, Pageable pageable);
    java.util.List<Course> findByLecturerId(Long lecturerId);

    @Query("""
        SELECT c FROM Course c
        WHERE (:status IS NULL OR c.status = :status)
          AND (:categoryId IS NULL OR c.category.id = :categoryId)
          AND (CAST(:keyword AS string) IS NULL OR CAST(:keyword AS string) = ''
               OR LOWER(c.title) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
               OR LOWER(c.description) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%')))
    """)
    Page<Course> searchCourses(
        @Param("keyword") String keyword,
        @Param("categoryId") Long categoryId,
        @Param("status") CourseStatus status,
        Pageable pageable
    );
}
