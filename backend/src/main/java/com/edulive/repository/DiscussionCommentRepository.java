package com.edulive.repository;

import com.edulive.entity.DiscussionComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiscussionCommentRepository extends JpaRepository<DiscussionComment, Long> {
    List<DiscussionComment> findByDiscussionIdAndParentIsNullOrderByCreatedAtAsc(Long discussionId);
    List<DiscussionComment> findByDiscussionIdOrderByCreatedAtAsc(Long discussionId);
    long countByDiscussionId(Long discussionId);
}
