package com.edulive.service;

import com.edulive.dto.quiz.*;
import com.edulive.entity.*;
import com.edulive.exception.AppException;
import com.edulive.exception.ResourceNotFoundException;
import com.edulive.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuizService {

    private final QuizRepository quizRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final QuizOptionRepository quizOptionRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizAnswerRepository quizAnswerRepository;
    private final CourseRepository courseRepository;
    private final ChapterRepository chapterRepository;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;

    @Transactional(readOnly = true)
    public List<QuizSummaryResponse> getQuizzesByCourse(Long courseId, Long currentUserId) {
        List<Quiz> quizzes = quizRepository.findByCourseIdOrderByCreatedAtAsc(courseId);

        return quizzes.stream().map(quiz -> {
            List<QuizQuestion> questions = quiz.getQuestions();
            int questionCount = questions != null ? questions.size() : 0;
            BigDecimal totalPoints = questions != null ? questions.stream()
                    .map(q -> q.getPoints() != null ? q.getPoints() : BigDecimal.ONE)
                    .reduce(BigDecimal.ZERO, BigDecimal::add) : BigDecimal.ZERO;

            Integer myAttemptsCount = 0;
            BigDecimal myHighestScore = null;
            Boolean myPassed = false;

            if (currentUserId != null) {
                myAttemptsCount = (int) quizAttemptRepository.countByQuizIdAndUserId(quiz.getId(), currentUserId);
                Optional<QuizAttempt> highest = quizAttemptRepository.findTopByQuizIdAndUserIdOrderByScoreDesc(quiz.getId(), currentUserId);
                if (highest.isPresent()) {
                    myHighestScore = highest.get().getScore();
                    myPassed = highest.get().getIsPassed();
                }
            }

            return QuizSummaryResponse.builder()
                    .id(quiz.getId())
                    .courseId(quiz.getCourse().getId())
                    .chapterId(quiz.getChapter() != null ? quiz.getChapter().getId() : null)
                    .title(quiz.getTitle())
                    .description(quiz.getDescription())
                    .timeLimitMinutes(quiz.getTimeLimitMinutes())
                    .maxAttempts(quiz.getMaxAttempts())
                    .passingScore(quiz.getPassingScore())
                    .questionCount(questionCount)
                    .totalPoints(totalPoints)
                    .myAttemptsCount(myAttemptsCount)
                    .myHighestScore(myHighestScore)
                    .myPassed(myPassed)
                    .createdAt(quiz.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public QuizDetailResponse getQuizById(Long quizId, Long currentUserId, boolean isTeacherOrAdmin) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz", "id", quizId));

        List<QuizQuestion> questions = quiz.getQuestions();
        int questionCount = questions != null ? questions.size() : 0;
        BigDecimal totalPoints = questions != null ? questions.stream()
                .map(q -> q.getPoints() != null ? q.getPoints() : BigDecimal.ONE)
                .reduce(BigDecimal.ZERO, BigDecimal::add) : BigDecimal.ZERO;

        Integer myAttemptsCount = 0;
        BigDecimal myHighestScore = null;
        Boolean myPassed = false;

        if (currentUserId != null) {
            myAttemptsCount = (int) quizAttemptRepository.countByQuizIdAndUserId(quiz.getId(), currentUserId);
            Optional<QuizAttempt> highest = quizAttemptRepository.findTopByQuizIdAndUserIdOrderByScoreDesc(quiz.getId(), currentUserId);
            if (highest.isPresent()) {
                myHighestScore = highest.get().getScore();
                myPassed = highest.get().getIsPassed();
            }
        }

        List<QuestionResponse> questionResponses = questions != null ? questions.stream().map(q -> {
            List<OptionResponse> optionResponses = q.getOptions().stream().map(o -> OptionResponse.builder()
                    .id(o.getId())
                    .optionText(o.getOptionText())
                    .isCorrect(isTeacherOrAdmin ? o.getIsCorrect() : null)
                    .orderIndex(o.getOrderIndex())
                    .build()
            ).collect(Collectors.toList());

            return QuestionResponse.builder()
                    .id(q.getId())
                    .questionText(q.getQuestionText())
                    .questionType(q.getQuestionType())
                    .explanation(isTeacherOrAdmin ? q.getExplanation() : null)
                    .points(q.getPoints())
                    .orderIndex(q.getOrderIndex())
                    .options(optionResponses)
                    .build();
        }).collect(Collectors.toList()) : Collections.emptyList();

        return QuizDetailResponse.builder()
                .id(quiz.getId())
                .courseId(quiz.getCourse().getId())
                .courseTitle(quiz.getCourse().getTitle())
                .chapterId(quiz.getChapter() != null ? quiz.getChapter().getId() : null)
                .chapterTitle(quiz.getChapter() != null ? quiz.getChapter().getTitle() : null)
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .timeLimitMinutes(quiz.getTimeLimitMinutes())
                .maxAttempts(quiz.getMaxAttempts())
                .passingScore(quiz.getPassingScore())
                .questionCount(questionCount)
                .totalPoints(totalPoints)
                .myAttemptsCount(myAttemptsCount)
                .myHighestScore(myHighestScore)
                .myPassed(myPassed)
                .createdAt(quiz.getCreatedAt())
                .questions(questionResponses)
                .build();
    }

    @Transactional
    public QuizDetailResponse createQuiz(Long currentUserId, CreateQuizRequest request) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", request.getCourseId()));

        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        if (!user.getRole().name().equals("ADMIN") && !course.getLecturer().getId().equals(currentUserId)) {
            throw new AppException("Bạn không có quyền tạo bài trắc nghiệm cho khóa học này", HttpStatus.FORBIDDEN);
        }

        Chapter chapter = null;
        if (request.getChapterId() != null) {
            chapter = chapterRepository.findById(request.getChapterId())
                    .orElseThrow(() -> new ResourceNotFoundException("Chapter", "id", request.getChapterId()));
        }

        Quiz quiz = Quiz.builder()
                .course(course)
                .chapter(chapter)
                .title(request.getTitle())
                .description(request.getDescription())
                .timeLimitMinutes(request.getTimeLimitMinutes() != null ? request.getTimeLimitMinutes() : 15)
                .maxAttempts(request.getMaxAttempts() != null ? request.getMaxAttempts() : 3)
                .passingScore(request.getPassingScore() != null ? request.getPassingScore() : new BigDecimal("50.0"))
                .questions(new ArrayList<>())
                .build();

        Quiz savedQuiz = quizRepository.save(quiz);

        if (request.getQuestions() != null && !request.getQuestions().isEmpty()) {
            int qIdx = 1;
            for (CreateQuestionRequest qReq : request.getQuestions()) {
                QuizQuestion question = QuizQuestion.builder()
                        .quiz(savedQuiz)
                        .questionText(qReq.getQuestionText())
                        .questionType(qReq.getQuestionType() != null ? qReq.getQuestionType() : QuestionType.SINGLE_CHOICE)
                        .explanation(qReq.getExplanation())
                        .points(qReq.getPoints() != null ? qReq.getPoints() : BigDecimal.ONE)
                        .orderIndex(qReq.getOrderIndex() != null ? qReq.getOrderIndex() : qIdx++)
                        .options(new ArrayList<>())
                        .build();

                QuizQuestion savedQuestion = quizQuestionRepository.save(question);

                if (qReq.getOptions() != null && !qReq.getOptions().isEmpty()) {
                    int oIdx = 1;
                    for (CreateOptionRequest oReq : qReq.getOptions()) {
                        QuizOption option = QuizOption.builder()
                                .question(savedQuestion)
                                .optionText(oReq.getOptionText())
                                .isCorrect(Boolean.TRUE.equals(oReq.getIsCorrect()))
                                .orderIndex(oReq.getOrderIndex() != null ? oReq.getOrderIndex() : oIdx++)
                                .build();
                        savedQuestion.getOptions().add(quizOptionRepository.save(option));
                    }
                }
                savedQuiz.getQuestions().add(savedQuestion);
            }
        }

        return getQuizById(savedQuiz.getId(), currentUserId, true);
    }

    @Transactional
    public QuizDetailResponse updateQuiz(Long quizId, Long currentUserId, UpdateQuizRequest request) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz", "id", quizId));

        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        if (!user.getRole().name().equals("ADMIN") && !quiz.getCourse().getLecturer().getId().equals(currentUserId)) {
            throw new AppException("Bạn không có quyền sửa bài trắc nghiệm này", HttpStatus.FORBIDDEN);
        }

        if (request.getChapterId() != null) {
            Chapter chapter = chapterRepository.findById(request.getChapterId())
                    .orElseThrow(() -> new ResourceNotFoundException("Chapter", "id", request.getChapterId()));
            quiz.setChapter(chapter);
        } else {
            quiz.setChapter(null);
        }

        quiz.setTitle(request.getTitle());
        quiz.setDescription(request.getDescription());
        if (request.getTimeLimitMinutes() != null) quiz.setTimeLimitMinutes(request.getTimeLimitMinutes());
        if (request.getMaxAttempts() != null) quiz.setMaxAttempts(request.getMaxAttempts());
        if (request.getPassingScore() != null) quiz.setPassingScore(request.getPassingScore());

        quizRepository.save(quiz);
        return getQuizById(quiz.getId(), currentUserId, true);
    }

    @Transactional
    public void deleteQuiz(Long quizId, Long currentUserId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz", "id", quizId));

        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        if (!user.getRole().name().equals("ADMIN") && !quiz.getCourse().getLecturer().getId().equals(currentUserId)) {
            throw new AppException("Bạn không có quyền xóa bài trắc nghiệm này", HttpStatus.FORBIDDEN);
        }

        quizRepository.delete(quiz);
    }

    @Transactional
    public QuestionResponse addQuestion(Long quizId, Long currentUserId, CreateQuestionRequest request) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz", "id", quizId));

        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        if (!user.getRole().name().equals("ADMIN") && !quiz.getCourse().getLecturer().getId().equals(currentUserId)) {
            throw new AppException("Bạn không có quyền thêm câu hỏi cho bài trắc nghiệm này", HttpStatus.FORBIDDEN);
        }

        long existingCount = quizQuestionRepository.countByQuizId(quizId);

        QuizQuestion question = QuizQuestion.builder()
                .quiz(quiz)
                .questionText(request.getQuestionText())
                .questionType(request.getQuestionType() != null ? request.getQuestionType() : QuestionType.SINGLE_CHOICE)
                .explanation(request.getExplanation())
                .points(request.getPoints() != null ? request.getPoints() : BigDecimal.ONE)
                .orderIndex(request.getOrderIndex() != null ? request.getOrderIndex() : (int) (existingCount + 1))
                .options(new ArrayList<>())
                .build();

        QuizQuestion savedQuestion = quizQuestionRepository.save(question);

        if (request.getOptions() != null && !request.getOptions().isEmpty()) {
            int oIdx = 1;
            for (CreateOptionRequest oReq : request.getOptions()) {
                QuizOption option = QuizOption.builder()
                        .question(savedQuestion)
                        .optionText(oReq.getOptionText())
                        .isCorrect(Boolean.TRUE.equals(oReq.getIsCorrect()))
                        .orderIndex(oReq.getOrderIndex() != null ? oReq.getOrderIndex() : oIdx++)
                        .build();
                savedQuestion.getOptions().add(quizOptionRepository.save(option));
            }
        }

        List<OptionResponse> optionResponses = savedQuestion.getOptions().stream().map(o -> OptionResponse.builder()
                .id(o.getId())
                .optionText(o.getOptionText())
                .isCorrect(o.getIsCorrect())
                .orderIndex(o.getOrderIndex())
                .build()
        ).collect(Collectors.toList());

        return QuestionResponse.builder()
                .id(savedQuestion.getId())
                .questionText(savedQuestion.getQuestionText())
                .questionType(savedQuestion.getQuestionType())
                .explanation(savedQuestion.getExplanation())
                .points(savedQuestion.getPoints())
                .orderIndex(savedQuestion.getOrderIndex())
                .options(optionResponses)
                .build();
    }

    @Transactional
    public void deleteQuestion(Long questionId, Long currentUserId) {
        QuizQuestion question = quizQuestionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("QuizQuestion", "id", questionId));

        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        Quiz quiz = question.getQuiz();
        if (!user.getRole().name().equals("ADMIN") && !quiz.getCourse().getLecturer().getId().equals(currentUserId)) {
            throw new AppException("Bạn không có quyền xóa câu hỏi này", HttpStatus.FORBIDDEN);
        }

        quizQuestionRepository.delete(question);
    }

    @Transactional
    public StartQuizResponse startQuiz(Long quizId, Long currentUserId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz", "id", quizId));

        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        // Kiểm tra quyền: nếu là học viên thì phải đã đăng ký khóa học
        boolean isEnrolled = enrollmentRepository.existsByUserIdAndCourseId(currentUserId, quiz.getCourse().getId());
        boolean isLecturerOrAdmin = user.getRole().name().equals("ADMIN") || quiz.getCourse().getLecturer().getId().equals(currentUserId);

        if (!isEnrolled && !isLecturerOrAdmin) {
            throw new AppException("Bạn cần tham gia khóa học trước khi làm bài trắc nghiệm này", HttpStatus.FORBIDDEN);
        }

        // Kiểm tra số lần thi
        long attemptsCount = quizAttemptRepository.countByQuizIdAndUserId(quizId, currentUserId);
        if (quiz.getMaxAttempts() != null && quiz.getMaxAttempts() > 0 && attemptsCount >= quiz.getMaxAttempts()) {
            throw new AppException("Bạn đã sử dụng hết số lần làm bài cho phép (tối đa " + quiz.getMaxAttempts() + " lần)", HttpStatus.BAD_REQUEST);
        }

        Instant now = Instant.now();
        QuizAttempt attempt = QuizAttempt.builder()
                .quiz(quiz)
                .user(user)
                .startedAt(now)
                .isPassed(false)
                .status(QuizAttemptStatus.IN_PROGRESS)
                .answers(new ArrayList<>())
                .build();

        QuizAttempt savedAttempt = quizAttemptRepository.save(attempt);

        Instant expiresAt = now.plusSeconds((long) quiz.getTimeLimitMinutes() * 60);

        List<QuizQuestion> questions = quiz.getQuestions();
        List<TakingQuestionResponse> takingQuestions = questions != null ? questions.stream().map(q -> {
            List<TakingOptionResponse> takingOptions = q.getOptions().stream().map(o -> TakingOptionResponse.builder()
                    .id(o.getId())
                    .optionText(o.getOptionText())
                    .orderIndex(o.getOrderIndex())
                    .build()
            ).collect(Collectors.toList());

            return TakingQuestionResponse.builder()
                    .id(q.getId())
                    .questionText(q.getQuestionText())
                    .questionType(q.getQuestionType())
                    .points(q.getPoints())
                    .orderIndex(q.getOrderIndex())
                    .options(takingOptions)
                    .build();
        }).collect(Collectors.toList()) : Collections.emptyList();

        return StartQuizResponse.builder()
                .attemptId(savedAttempt.getId())
                .quizId(quiz.getId())
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .timeLimitMinutes(quiz.getTimeLimitMinutes())
                .startedAt(now)
                .expiresAt(expiresAt)
                .questions(takingQuestions)
                .build();
    }

    @Transactional
    public QuizResultResponse submitQuiz(Long attemptId, Long currentUserId, SubmitQuizRequest request) {
        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("QuizAttempt", "id", attemptId));

        if (!attempt.getUser().getId().equals(currentUserId)) {
            throw new AppException("Bạn không có quyền nộp bài cho lượt thi này", HttpStatus.FORBIDDEN);
        }

        if (attempt.getStatus() != QuizAttemptStatus.IN_PROGRESS) {
            throw new AppException("Bài thi này đã được nộp hoặc đã kết thúc", HttpStatus.BAD_REQUEST);
        }

        Instant now = Instant.now();
        Quiz quiz = attempt.getQuiz();

        // Thời gian tối đa cho phép + 45 giây đệm trễ mạng
        long limitSeconds = (long) quiz.getTimeLimitMinutes() * 60 + 45;
        Instant deadline = attempt.getStartedAt().plusSeconds(limitSeconds);
        boolean isTimedOut = now.isAfter(deadline);

        // Chuẩn bị map câu trả lời của thí sinh
        Map<Long, List<Long>> userAnswersMap = new HashMap<>();
        if (request.getAnswers() != null) {
            for (SubmitAnswerRequest ans : request.getAnswers()) {
                if (ans.getQuestionId() != null && ans.getSelectedOptionIds() != null) {
                    userAnswersMap.put(ans.getQuestionId(), ans.getSelectedOptionIds());
                }
            }
        }

        List<QuizQuestion> questions = quiz.getQuestions();
        BigDecimal totalPoints = BigDecimal.ZERO;
        BigDecimal earnedPoints = BigDecimal.ZERO;
        int correctQuestionsCount = 0;
        int totalQuestions = questions != null ? questions.size() : 0;

        List<ReviewAnswerResponse> reviewQuestions = new ArrayList<>();

        if (questions != null) {
            for (QuizQuestion q : questions) {
                BigDecimal qPoints = q.getPoints() != null ? q.getPoints() : BigDecimal.ONE;
                totalPoints = totalPoints.add(qPoints);

                Set<Long> correctOptionIds = q.getOptions().stream()
                        .filter(QuizOption::getIsCorrect)
                        .map(QuizOption::getId)
                        .collect(Collectors.toSet());

                List<Long> selectedOptionIds = userAnswersMap.getOrDefault(q.getId(), Collections.emptyList());
                Set<Long> userSelectedSet = new HashSet<>(selectedOptionIds);

                boolean isCorrect = false;
                if (q.getQuestionType() == QuestionType.SINGLE_CHOICE || q.getQuestionType() == QuestionType.TRUE_FALSE) {
                    isCorrect = userSelectedSet.size() == 1 && correctOptionIds.containsAll(userSelectedSet);
                } else if (q.getQuestionType() == QuestionType.MULTIPLE_CHOICE) {
                    isCorrect = !correctOptionIds.isEmpty() && correctOptionIds.equals(userSelectedSet);
                }

                BigDecimal qEarned = isCorrect ? qPoints : BigDecimal.ZERO;
                if (isCorrect) {
                    earnedPoints = earnedPoints.add(qPoints);
                    correctQuestionsCount++;
                }

                // Lưu câu trả lời QuizAnswer
                String selectedIdsStr = selectedOptionIds.stream()
                        .map(String::valueOf)
                        .collect(Collectors.joining(","));

                QuizAnswer answer = QuizAnswer.builder()
                        .attempt(attempt)
                        .question(q)
                        .selectedOptionIds(selectedIdsStr)
                        .build();
                quizAnswerRepository.save(answer);

                // Tạo review option
                List<ReviewOptionResponse> reviewOptions = q.getOptions().stream().map(o -> ReviewOptionResponse.builder()
                        .id(o.getId())
                        .optionText(o.getOptionText())
                        .isCorrect(o.getIsCorrect())
                        .isSelectedByUser(userSelectedSet.contains(o.getId()))
                        .orderIndex(o.getOrderIndex())
                        .build()
                ).collect(Collectors.toList());

                reviewQuestions.add(ReviewAnswerResponse.builder()
                        .questionId(q.getId())
                        .questionText(q.getQuestionText())
                        .questionType(q.getQuestionType())
                        .points(qPoints)
                        .earnedPoints(qEarned)
                        .isCorrect(isCorrect)
                        .selectedOptionIds(selectedOptionIds)
                        .options(reviewOptions)
                        .explanation(q.getExplanation())
                        .build()
                );
            }
        }

        // Quy đổi ra thang điểm 100
        BigDecimal score = BigDecimal.ZERO;
        if (totalPoints.compareTo(BigDecimal.ZERO) > 0) {
            score = earnedPoints.multiply(new BigDecimal(100)).divide(totalPoints, 2, RoundingMode.HALF_UP);
        }

        boolean isPassed = score.compareTo(quiz.getPassingScore()) >= 0;

        attempt.setSubmittedAt(now);
        attempt.setScore(score);
        attempt.setIsPassed(isPassed);
        attempt.setStatus(isTimedOut ? QuizAttemptStatus.TIMED_OUT : QuizAttemptStatus.SUBMITTED);
        quizAttemptRepository.save(attempt);

        long durationSeconds = Duration.between(attempt.getStartedAt(), now).getSeconds();

        return QuizResultResponse.builder()
                .attemptId(attempt.getId())
                .quizId(quiz.getId())
                .quizTitle(quiz.getTitle())
                .score(score)
                .passingScore(quiz.getPassingScore())
                .isPassed(isPassed)
                .status(attempt.getStatus())
                .totalPoints(totalPoints)
                .earnedPoints(earnedPoints)
                .totalQuestions(totalQuestions)
                .correctQuestionsCount(correctQuestionsCount)
                .startedAt(attempt.getStartedAt())
                .submittedAt(now)
                .durationSeconds(durationSeconds)
                .reviewQuestions(reviewQuestions)
                .build();
    }

    @Transactional(readOnly = true)
    public QuizResultResponse getAttemptResult(Long attemptId, Long currentUserId) {
        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("QuizAttempt", "id", attemptId));

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        Quiz quiz = attempt.getQuiz();
        boolean isOwner = attempt.getUser().getId().equals(currentUserId);
        boolean isTeacherOrAdmin = currentUser.getRole().name().equals("ADMIN") || quiz.getCourse().getLecturer().getId().equals(currentUserId);

        if (!isOwner && !isTeacherOrAdmin) {
            throw new AppException("Bạn không có quyền xem kết quả bài thi này", HttpStatus.FORBIDDEN);
        }

        List<QuizAnswer> answers = quizAnswerRepository.findByAttemptId(attemptId);
        Map<Long, List<Long>> userAnswersMap = new HashMap<>();
        for (QuizAnswer ans : answers) {
            if (ans.getSelectedOptionIds() != null && !ans.getSelectedOptionIds().isBlank()) {
                List<Long> ids = Arrays.stream(ans.getSelectedOptionIds().split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .map(Long::parseLong)
                        .collect(Collectors.toList());
                userAnswersMap.put(ans.getQuestion().getId(), ids);
            }
        }

        List<QuizQuestion> questions = quiz.getQuestions();
        BigDecimal totalPoints = BigDecimal.ZERO;
        BigDecimal earnedPoints = BigDecimal.ZERO;
        int correctQuestionsCount = 0;
        int totalQuestions = questions != null ? questions.size() : 0;

        List<ReviewAnswerResponse> reviewQuestions = new ArrayList<>();

        if (questions != null) {
            for (QuizQuestion q : questions) {
                BigDecimal qPoints = q.getPoints() != null ? q.getPoints() : BigDecimal.ONE;
                totalPoints = totalPoints.add(qPoints);

                Set<Long> correctOptionIds = q.getOptions().stream()
                        .filter(QuizOption::getIsCorrect)
                        .map(QuizOption::getId)
                        .collect(Collectors.toSet());

                List<Long> selectedOptionIds = userAnswersMap.getOrDefault(q.getId(), Collections.emptyList());
                Set<Long> userSelectedSet = new HashSet<>(selectedOptionIds);

                boolean isCorrect = false;
                if (q.getQuestionType() == QuestionType.SINGLE_CHOICE || q.getQuestionType() == QuestionType.TRUE_FALSE) {
                    isCorrect = userSelectedSet.size() == 1 && correctOptionIds.containsAll(userSelectedSet);
                } else if (q.getQuestionType() == QuestionType.MULTIPLE_CHOICE) {
                    isCorrect = !correctOptionIds.isEmpty() && correctOptionIds.equals(userSelectedSet);
                }

                BigDecimal qEarned = isCorrect ? qPoints : BigDecimal.ZERO;
                if (isCorrect) {
                    earnedPoints = earnedPoints.add(qPoints);
                    correctQuestionsCount++;
                }

                List<ReviewOptionResponse> reviewOptions = q.getOptions().stream().map(o -> ReviewOptionResponse.builder()
                        .id(o.getId())
                        .optionText(o.getOptionText())
                        .isCorrect(o.getIsCorrect())
                        .isSelectedByUser(userSelectedSet.contains(o.getId()))
                        .orderIndex(o.getOrderIndex())
                        .build()
                ).collect(Collectors.toList());

                reviewQuestions.add(ReviewAnswerResponse.builder()
                        .questionId(q.getId())
                        .questionText(q.getQuestionText())
                        .questionType(q.getQuestionType())
                        .points(qPoints)
                        .earnedPoints(qEarned)
                        .isCorrect(isCorrect)
                        .selectedOptionIds(selectedOptionIds)
                        .options(reviewOptions)
                        .explanation(q.getExplanation())
                        .build()
                );
            }
        }

        long durationSeconds = 0;
        if (attempt.getStartedAt() != null && attempt.getSubmittedAt() != null) {
            durationSeconds = Duration.between(attempt.getStartedAt(), attempt.getSubmittedAt()).getSeconds();
        }

        return QuizResultResponse.builder()
                .attemptId(attempt.getId())
                .quizId(quiz.getId())
                .quizTitle(quiz.getTitle())
                .score(attempt.getScore() != null ? attempt.getScore() : BigDecimal.ZERO)
                .passingScore(quiz.getPassingScore())
                .isPassed(attempt.getIsPassed())
                .status(attempt.getStatus())
                .totalPoints(totalPoints)
                .earnedPoints(earnedPoints)
                .totalQuestions(totalQuestions)
                .correctQuestionsCount(correctQuestionsCount)
                .startedAt(attempt.getStartedAt())
                .submittedAt(attempt.getSubmittedAt())
                .durationSeconds(durationSeconds)
                .reviewQuestions(reviewQuestions)
                .build();
    }

    @Transactional(readOnly = true)
    public QuizStatisticsResponse getQuizStatistics(Long quizId, Long currentUserId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz", "id", quizId));

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        if (!currentUser.getRole().name().equals("ADMIN") && !quiz.getCourse().getLecturer().getId().equals(currentUserId)) {
            throw new AppException("Bạn không có quyền xem thống kê bài trắc nghiệm này", HttpStatus.FORBIDDEN);
        }

        List<QuizAttempt> attempts = quizAttemptRepository.findByQuizIdOrderByStartedAtDesc(quizId);
        List<QuizAttempt> submittedAttempts = attempts.stream()
                .filter(a -> a.getStatus() != QuizAttemptStatus.IN_PROGRESS && a.getScore() != null)
                .collect(Collectors.toList());

        int totalAttempts = submittedAttempts.size();
        Set<Long> uniqueUserIds = submittedAttempts.stream().map(a -> a.getUser().getId()).collect(Collectors.toSet());
        int uniqueParticipants = uniqueUserIds.size();

        BigDecimal averageScore = BigDecimal.ZERO;
        BigDecimal highestScore = BigDecimal.ZERO;
        BigDecimal lowestScore = BigDecimal.ZERO;
        int passCount = 0;
        BigDecimal passRatePercent = BigDecimal.ZERO;

        if (totalAttempts > 0) {
            BigDecimal sumScore = BigDecimal.ZERO;
            highestScore = submittedAttempts.get(0).getScore();
            lowestScore = submittedAttempts.get(0).getScore();

            for (QuizAttempt a : submittedAttempts) {
                BigDecimal sc = a.getScore();
                sumScore = sumScore.add(sc);
                if (sc.compareTo(highestScore) > 0) highestScore = sc;
                if (sc.compareTo(lowestScore) < 0) lowestScore = sc;
                if (Boolean.TRUE.equals(a.getIsPassed())) passCount++;
            }

            averageScore = sumScore.divide(new BigDecimal(totalAttempts), 2, RoundingMode.HALF_UP);
            passRatePercent = new BigDecimal(passCount).multiply(new BigDecimal(100))
                    .divide(new BigDecimal(totalAttempts), 2, RoundingMode.HALF_UP);
        }

        List<QuizAttemptItemResponse> itemResponses = submittedAttempts.stream().map(a -> {
            long dur = 0;
            if (a.getStartedAt() != null && a.getSubmittedAt() != null) {
                dur = Duration.between(a.getStartedAt(), a.getSubmittedAt()).getSeconds();
            }
            return QuizAttemptItemResponse.builder()
                    .attemptId(a.getId())
                    .userId(a.getUser().getId())
                    .userFullName(a.getUser().getFullName())
                    .userEmail(a.getUser().getEmail())
                    .score(a.getScore())
                    .isPassed(a.getIsPassed())
                    .status(a.getStatus())
                    .startedAt(a.getStartedAt())
                    .submittedAt(a.getSubmittedAt())
                    .durationSeconds(dur)
                    .build();
        }).collect(Collectors.toList());

        return QuizStatisticsResponse.builder()
                .quizId(quiz.getId())
                .quizTitle(quiz.getTitle())
                .totalAttempts(totalAttempts)
                .uniqueParticipants(uniqueParticipants)
                .averageScore(averageScore)
                .highestScore(highestScore)
                .lowestScore(lowestScore)
                .passCount(passCount)
                .passRatePercent(passRatePercent)
                .attempts(itemResponses)
                .build();
    }

    @Transactional(readOnly = true)
    public byte[] exportQuizCsv(Long quizId, Long currentUserId) {
        QuizStatisticsResponse stats = getQuizStatistics(quizId, currentUserId);

        StringBuilder sb = new StringBuilder();
        // UTF-8 BOM
        sb.append('\uFEFF');

        sb.append("BÁO CÁO KẾT QUẢ BÀI THI TRẮC NGHIỆM: ").append(stats.getQuizTitle()).append("\n");
        sb.append("Tổng số lượt nộp: ").append(stats.getTotalAttempts()).append("\n");
        sb.append("Số thí sinh tham gia: ").append(stats.getUniqueParticipants()).append("\n");
        sb.append("Điểm trung bình: ").append(stats.getAverageScore()).append("\n");
        sb.append("Điểm cao nhất: ").append(stats.getHighestScore()).append("\n");
        sb.append("Tỷ lệ đạt: ").append(stats.getPassRatePercent()).append("%\n\n");

        sb.append("STT,Họ và tên,Email,Điểm số (Thang 100),Kết quả,Trạng thái,Thời gian nộp,Thời lượng (giây)\n");

        int stt = 1;
        DateTimeFormatter dtf = DateTimeFormatter.ISO_INSTANT;
        for (QuizAttemptItemResponse a : stats.getAttempts()) {
            sb.append(stt++).append(",")
                    .append("\"").append(a.getUserFullName().replace("\"", "\"\"")).append("\",")
                    .append("\"").append(a.getUserEmail()).append("\",")
                    .append(a.getScore()).append(",")
                    .append(Boolean.TRUE.equals(a.getIsPassed()) ? "ĐẠT" : "KHÔNG ĐẠT").append(",")
                    .append(a.getStatus().name()).append(",")
                    .append(a.getSubmittedAt() != null ? dtf.format(a.getSubmittedAt()) : "").append(",")
                    .append(a.getDurationSeconds()).append("\n");
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }
}
