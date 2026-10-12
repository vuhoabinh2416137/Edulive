package com.edulive.repository;

import com.edulive.entity.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    Optional<Enrollment> findByUserIdAndCourseId(Long userId, Long courseId);

    boolean existsByUserIdAndCourseId(Long userId, Long courseId);

    @Query("SELECT e FROM Enrollment e JOIN FETCH e.course c WHERE e.user.id = :userId ORDER BY e.enrolledAt DESC")
    List<Enrollment> findByUserIdWithCourse(@Param("userId") Long userId);

    long countByCourseId(Long courseId);
}
