package com.edulive.repository;

import com.edulive.entity.VideoRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VideoRoomRepository extends JpaRepository<VideoRoom, Long> {
    Optional<VideoRoom> findByRoomCode(String roomCode);
    List<VideoRoom> findByCourseIdOrderByScheduledAtDesc(Long courseId);
    List<VideoRoom> findByCourseIdAndIsActiveTrue(Long courseId);
    boolean existsByRoomCode(String roomCode);
}
